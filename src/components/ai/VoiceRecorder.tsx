'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

export function VoiceRecorder({ onTranscriptionComplete, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [useFallback, setUseFallback] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 检查是否支持Web Speech API
  const isWebSpeechSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // 使用Web Speech API进行语音识别
  const startWebSpeechRecognition = useCallback(() => {
    if (!isWebSpeechSupported()) {
      setError('浏览器不支持语音识别功能');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Web Speech API 语音识别开始');
      setIsRecording(true);
      setRecordingTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const confidence = event.results[event.results.length - 1][0].confidence;
      
      console.log('✅ Web Speech API 识别结果:', transcript);
      console.log('🎯 置信度:', confidence);
      
      onTranscriptionComplete(transcript);
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingTime(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Web Speech API 错误:', event.error);
      setError(`语音识别失败: ${event.error}`);
      setIsRecording(false);
      setIsProcessing(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognition.onend = () => {
      console.log('🔚 Web Speech API 识别结束');
      setIsRecording(false);
      setIsProcessing(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscriptionComplete]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError('');
      setIsUploading(true);
      setUploadProgress(0);

      // 验证文件类型
      const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|mpeg|webm|ogg)$/i)) {
        throw new Error('不支持的文件格式，请上传 WAV、MP3、WEBM 或 OGG 格式的音频文件');
      }

      // 验证文件大小 (限制为50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('文件太大，请上传小于50MB的音频文件');
      }

      console.log('📁 开始处理上传的音频文件:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // 创建FormData用于文件上传
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('uploadType', 'file'); // 标记为文件上传

      setUploadProgress(30);

      // 调用语音识别API
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(80);

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || '文件上传失败');
      }

      if (!result.success) {
        throw new Error(result.error || '语音识别失败');
      }

      console.log('✅ 文件上传语音识别成功:', result.text);
      setUploadProgress(100);
      
      // 调用回调函数
      onTranscriptionComplete(result.text);
      
      // 重置状态
      setIsUploading(false);
      setUploadProgress(0);
      
    } catch (err) {
      console.error('文件上传处理失败:', err);
      const errorMessage = err instanceof Error ? err.message : '文件处理失败，请重试';
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
      
      // 如果科大讯飞API失败，不需要降级到Web Speech API（文件上传模式）
      // 因为Web Speech API不支持处理音频文件
    }
  }, [onTranscriptionComplete]);

  // 触发文件选择
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 文件选择处理
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // 清空input值，允许重复上传同一文件
    if (event.target) {
      event.target.value = '';
    }
  }, [handleFileUpload]);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      
      // 配置音频参数以符合科大讯飞要求
      const constraints = {
        audio: {
          sampleRate: 16000,      // 16kHz采样率
          channelCount: 1,        // 单声道
          echoCancellation: true, // 回音消除
          noiseSuppression: true, // 噪音抑制
          autoGainControl: true   // 自动增益控制
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 尝试使用指定的MIME类型
      let mimeType = 'audio/wav';
      if (MediaRecorder.isTypeSupported('audio/wav; codecs=pcm')) {
        mimeType = 'audio/wav; codecs=pcm';
      } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
      }
      
      console.log('🎙️ 录音配置:', { mimeType, constraints });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && useFallback) {
      // 停止Web Speech API
      recognitionRef.current.stop();
      console.log('🛑 停止Web Speech API录音');
    } else if (mediaRecorderRef.current && isRecording) {
      // 停止传统录音
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, useFallback]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // 验证回调函数是否存在
      if (typeof onTranscriptionComplete !== 'function') {
        console.error('onTranscriptionComplete is not a function:', onTranscriptionComplete);
        setError('回调函数配置错误');
        setIsProcessing(false);
        return;
      }

      console.log('🎤 开始处理录音音频，使用FormData上传...');
      
      console.log('📊 音频信息:', {
        originalSize: audioBlob.size,
        audioType: audioBlob.type,
        duration: recordingTime
      });
      
      // 对于录音文件，使用FormData方式上传以支持更大的文件
      const formData = new FormData();
      
      // 创建File对象
      const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, {
        type: audioBlob.type || 'audio/wav'
      });
      
      formData.append('audio', audioFile);
      formData.append('uploadType', 'recording'); // 标记为录音上传
      formData.append('duration', recordingTime.toString());

      // 调用语音识别API
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || '语音识别请求失败');
      }

      console.log('📡 语音识别API响应:', result);
      
      // 如果返回的是具体的API错误，显示更友好的信息
      if (result && !result.success && result.error) {
        console.log('🔍 详细错误信息:', result.error);
      }

      if (!result.success) {
        throw new Error(result.error || '语音识别失败');
      }

      const recognizedText = result.text;
      console.log('✅ 语音识别成功:', recognizedText);
      console.log('🎯 置信度:', result.confidence);
      
      if (!recognizedText || recognizedText.trim().length === 0) {
        throw new Error('未识别到语音内容，请重新录制');
      }
      
      console.log('🎤 正在调用回调函数:', typeof onTranscriptionComplete);
      onTranscriptionComplete(recognizedText);
      
      setIsProcessing(false);
      setRecordingTime(0);
      
    } catch (err) {
      console.error('语音转换失败:', err);
      const errorMessage = err instanceof Error ? err.message : '语音转换失败，请重试';
      setError(errorMessage);
      setIsProcessing(false);
      
      // 如果科大讯飞API调用失败，切换到Web Speech API
      if (errorMessage.includes('配置缺失') || 
          errorMessage.includes('调用失败') || 
          errorMessage.includes('CloudBase') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('音频格式') ||
          errorMessage.includes('音频采样率')) {
        
        console.log('🔄 科大讯飞API调用失败，切换到浏览器Web Speech API');
        setUseFallback(true);
        setError('科大讯飞API调用失败，已切换到浏览器语音识别');
        
        // 自动重新开始录音，使用Web Speech API
        setTimeout(() => {
          setError('');
          startWebSpeechRecognition();
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <>
            <Button
              onClick={startRecording}
              disabled={isProcessing || isUploading}
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>{isProcessing ? '处理中...' : '开始录音'}</span>
            </Button>
            
            <Button
              onClick={triggerFileUpload}
              disabled={isProcessing || isUploading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <span>{isUploading ? '上传中...' : '上传文件'}</span>
            </Button>
          </>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
            <span>停止录音</span>
          </Button>
        )}
        
        {(isRecording || isProcessing || isUploading) && (
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isRecording ? 'bg-red-500 animate-pulse' : 
              isUploading ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'
            )} />
            <span className="text-sm text-gray-600">
              {isRecording ? `录音中 ${formatTime(recordingTime)}` : 
               isUploading ? `上传中 ${uploadProgress}%` : '转换中...'}
            </span>
          </div>
        )}
      </div>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/wav,audio/mp3,audio/mpeg,audio/webm,audio/ogg,.wav,.mp3,.mpeg,.webm,.ogg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      {/* 上传进度条 */}
      {isUploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <div>
          • <strong>录音模式</strong>：点击"开始录音"并允许浏览器访问麦克风权限
        </div>
        <div>
          • <strong>文件上传</strong>：点击"上传文件"选择WAV、MP3、WEBM或OGG格式的音频文件（最大50MB）
        </div>
        <div>
          • 在安静环境下清晰地说话，建议录音时长10-60秒，支持更长录音的持久化处理
        </div>
        <div>
          • {useFallback ? '使用浏览器Web Speech API进行语音识别' : '通过CloudBase云函数调用科大讯飞API'}
        </div>
        <div>
          • 支持中文普通话识别，{useFallback ? '自动选择最佳识别方案' : '准确率可达95%以上'}
        </div>
        {useFallback && isWebSpeechSupported() && (
          <div className="text-blue-600">
            ℹ️ 当前使用浏览器语音识别（降级方案）
          </div>
        )}
      </div>
    </div>
  );
}