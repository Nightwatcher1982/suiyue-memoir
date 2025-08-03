'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ProfessionalVoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

export function ProfessionalVoiceInput({ onTranscriptionComplete, className }: ProfessionalVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setError('');
      setTranscriptText('');
      setConfidence(0);
      
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
      
      // 科大讯飞IAT需要特定格式，优先使用WAV
      let mimeType = 'audio/wav';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
        console.warn('⚠️ 浏览器不支持WAV，使用WebM格式，可能影响识别准确性');
      } else {
        console.warn('⚠️ 浏览器音频格式支持有限，可能影响识别效果');
      }
      
      console.log('🎙️ 专业录音配置:', { mimeType, constraints });
      
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

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  // 处理音频
  const processAudio = async (audioBlob: Blob) => {
    try {
      console.log('🎤 开始处理录音音频，使用科大讯飞专业API...');
      
      console.log('📊 音频信息:', {
        originalSize: audioBlob.size,
        audioType: audioBlob.type,
        duration: recordingTime
      });
      
      // 使用API route处理音频
      const formData = new FormData();
      
      const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, {
        type: audioBlob.type || 'audio/wav'
      });
      
      formData.append('audio', audioFile);
      formData.append('uploadType', 'recording');
      formData.append('duration', recordingTime.toString());
      
      console.log('🎤 调用专业语音识别API...');
      
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '网络请求失败');
      }
      
      const result = await response.json();

      console.log('📡 专业语音识别API响应:', result);
      
      if (!result.success) {
        const errorDetail = result.error || result.details || '语音识别失败';
        console.error('❌ 专业语音识别失败，详细错误:', errorDetail);
        throw new Error(errorDetail);
      }

      const recognizedText = result.text;
      const confidenceScore = result.confidence || 0.95;
      
      console.log('✅ 专业语音识别成功:', recognizedText);
      console.log('🎯 置信度:', confidenceScore);
      
      if (!recognizedText || recognizedText.trim().length === 0) {
        throw new Error('未识别到语音内容，请重新录制');
      }
      
      setTranscriptText(recognizedText);
      setConfidence(confidenceScore);
      setIsProcessing(false);
      setRecordingTime(0);
      
    } catch (err) {
      console.error('专业语音转换失败:', err);
      const errorMessage = err instanceof Error ? err.message : '专业语音转换失败，请重试';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError('');
      setTranscriptText('');
      setConfidence(0);
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

      setUploadProgress(30);

      // 使用API route处理文件上传
      console.log('📁 调用专业语音识别API处理文件上传...');
      
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('uploadType', 'file');
      formData.append('duration', '0');
      
      setUploadProgress(50);
      
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || '网络请求失败');
      }
      
      const result = await response.json();

      setUploadProgress(80);

      console.log('📡 文件上传API响应:', result);
      
      if (!result.success) {
        throw new Error(result.error || result.details || '语音识别失败');
      }

      console.log('✅ 文件上传语音识别成功:', result.text);
      setUploadProgress(100);
      
      setTranscriptText(result.text);
      setConfidence(result.confidence || 0.95);
      
      // 重置状态
      setIsUploading(false);
      setUploadProgress(0);
      
    } catch (err) {
      console.error('文件上传处理失败:', err);
      const errorMessage = err instanceof Error ? err.message : '文件处理失败，请重试';
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

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

  // 导入编辑器
  const handleImportToEditor = useCallback(() => {
    if (transcriptText.trim()) {
      onTranscriptionComplete(transcriptText.trim());
      setTranscriptText('');
      setConfidence(0);
      setError('');
      console.log('📝 专业识别文本已导入编辑器');
    }
  }, [transcriptText, onTranscriptionComplete]);

  // 清空文本
  const handleClearText = useCallback(() => {
    setTranscriptText('');
    setConfidence(0);
    setError('');
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-purple-50', className)}>
      {/* 标题 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-purple-700 mb-1">专业语音转文字</h3>
        <p className="text-sm text-purple-600">科大讯飞AI引擎 • 高精度 • 支持长音频</p>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center space-x-3 flex-wrap gap-2">
        {!isRecording ? (
          <>
            <Button
              onClick={startRecording}
              disabled={isProcessing || isUploading}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
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
              className="flex items-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-100"
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
            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* 识别结果显示 */}
      {transcriptText && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500">识别结果：</div>
              {confidence > 0 && (
                <div className="text-xs text-green-600">
                  置信度: {(confidence * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-gray-900 leading-relaxed">
              {transcriptText}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleImportToEditor}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              导入编辑器
            </Button>
            
            <Button
              onClick={handleClearText}
              variant="outline"
              size="sm"
            >
              清空文本
            </Button>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border">
          {error}
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-xs text-purple-600 space-y-1">
        <div>
          • <strong>高精度识别</strong>：科大讯飞AI引擎，准确率可达95%以上
        </div>
        <div>
          • <strong>支持长音频</strong>：录音模式支持长时间录制，文件模式支持大文件(50MB)
        </div>
        <div>
          • <strong>双重处理</strong>：智能选择实时识别(IAT)或文件识别(LFASR)
        </div>
        <div>
          • <strong>专业优化</strong>：16kHz采样率，针对中文普通话优化
        </div>
      </div>
    </div>
  );
}