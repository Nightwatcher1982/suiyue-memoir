'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onAudioSave?: (audioBlob: Blob, transcript: string) => void;
  className?: string;
}

export function VoiceRecorder({ onTranscription, onAudioSave, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'standard' | 'dialect'>('standard');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 清理资源
  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // 设置音频分析器
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      analyserRef.current = analyser;
      
      // 监控音频电平
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / bufferLength;
          setAudioLevel(Math.min(100, (average / 128) * 100));
        }
      };
      
      intervalRef.current = setInterval(updateAudioLevel, 100);
      
      // 设置录音器
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        processRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // 录音时间计时器
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('录音启动失败:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      cleanup();
    }
  };

  // 处理录音
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // 模拟语音转文字处理
      const transcript = await simulateVoiceToText(audioBlob, selectedLanguage);
      
      onTranscription(transcript);
      
      if (onAudioSave) {
        onAudioSave(audioBlob, transcript);
      }
      
    } catch (error) {
      console.error('语音处理失败:', error);
      alert('语音转文字失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 模拟语音转文字
  const simulateVoiceToText = async (audioBlob: Blob, language: string): Promise<string> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: 集成真实的ASR服务
    // 这里应该调用腾讯云ASR或讯飞API
    
    const mockTranscripts = {
      standard: [
        '今天天气很好，我想起了小时候和爷爷一起在院子里种花的日子。',
        '那是一个春天的下午，阳光透过树叶洒在地上，我们一起挖土、播种。',
        '记得那时候我总是问爷爷很多问题，他总是很耐心地回答我。',
        '现在想起来，那些简单的时光是多么珍贵。'
      ],
      dialect: [
        '小时候俺爷爷常常跟俺讲，做人要诚实，要善良。',
        '俺记得那会儿家里条件不好，但是大家都很团结。',
        '邻里之间互相帮助，有困难的时候从来不会袖手旁观。',
        '那种人情味，现在是越来越少见了。'
      ]
    };
    
    const transcripts = mockTranscripts[language as keyof typeof mockTranscripts] || mockTranscripts.standard;
    return transcripts[Math.floor(Math.random() * transcripts.length)];
  };

  // 格式化录音时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const languages = [
    { value: 'standard', label: '标准普通话', description: '适用于标准中文语音' },
    { value: 'dialect', label: '方言优化', description: '使用讯飞API，支持各地方言' }
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* 语言选择 */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLanguageOptions(!showLanguageOptions)}
          className="w-full justify-between"
        >
          <span>{languages.find(l => l.value === selectedLanguage)?.label}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
        
        {showLanguageOptions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => {
                  setSelectedLanguage(lang.value as 'standard' | 'dialect');
                  setShowLanguageOptions(false);
                }}
                className={cn(
                  'w-full text-left p-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg',
                  selectedLanguage === lang.value && 'bg-blue-50 text-blue-700'
                )}
              >
                <div className="font-medium text-sm">{lang.label}</div>
                <div className="text-xs text-gray-500 mt-1">{lang.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 录音控制 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          {/* 录音按钮 */}
          <div className="mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white',
                isProcessing && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isRecording ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              )}
            </button>
          </div>

          {/* 状态显示 */}
          <div className="mb-4">
            {isProcessing ? (
              <div className="text-blue-600">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">正在转换语音...</p>
              </div>
            ) : isRecording ? (
              <div className="text-red-600">
                <p className="text-lg font-medium">录音中</p>
                <p className="text-sm">{formatTime(recordingTime)}</p>
              </div>
            ) : (
              <div className="text-gray-600">
                <p className="text-sm">点击开始录音</p>
                <p className="text-xs mt-1">支持普通话和方言识别</p>
              </div>
            )}
          </div>

          {/* 音频电平指示器 */}
          {isRecording && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">音量: {Math.round(audioLevel)}%</p>
            </div>
          )}

          {/* 操作提示 */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 建议在安静环境中录音，获得更好效果</p>
            <p>• {selectedLanguage === 'dialect' ? '方言模式' : '标准模式'}已启用</p>
            <p>• 录音完成后将自动转换为文字</p>
          </div>
        </div>
      </div>
    </div>
  );
} 