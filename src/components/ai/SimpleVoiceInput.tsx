'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SimpleVoiceInputProps {
  onTranscriptionComplete: (text: string) => void;
  className?: string;
}

export function SimpleVoiceInput({ onTranscriptionComplete, className }: SimpleVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [interimResults, setInterimResults] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 检查是否支持Web Speech API
  const isWebSpeechSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  const startRecording = useCallback(() => {
    if (!isWebSpeechSupported()) {
      setError('您的浏览器不支持语音识别功能，请使用Chrome、Edge或Safari等现代浏览器');
      return;
    }

    setError('');
    setTranscriptText('');
    setInterimResults('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 浏览器语音识别开始');
      setIsRecording(true);
      setRecordingTime(0);
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscriptText(prev => prev + finalTranscript);
        console.log('✅ 最终识别结果:', finalTranscript);
      }
      
      setInterimResults(interimTranscript);
      console.log('🔄 临时识别结果:', interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ 语音识别错误:', event.error);
      
      let errorMessage = '语音识别出现错误';
      switch (event.error) {
        case 'no-speech':
          errorMessage = '没有检测到语音，请重新尝试';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查权限设置';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风';
          break;
        case 'network':
          errorMessage = '网络连接错误，请检查网络连接';
          break;
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用';
          break;
        default:
          errorMessage = `语音识别失败: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognition.onend = () => {
      console.log('🔚 语音识别结束');
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      console.log('🛑 停止语音识别');
    }
  }, [isRecording]);

  const handleImportToEditor = useCallback(() => {
    if (transcriptText.trim()) {
      onTranscriptionComplete(transcriptText.trim());
      setTranscriptText('');
      setInterimResults('');
      console.log('📝 文本已导入编辑器');
    }
  }, [transcriptText, onTranscriptionComplete]);

  const handleClearText = useCallback(() => {
    setTranscriptText('');
    setInterimResults('');
    setError('');
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isWebSpeechSupported()) {
    return (
      <div className={cn('space-y-4 p-4 border rounded-lg bg-gray-50', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">普通语音转文字</h3>
          <div className="text-red-600 text-sm">
            ⚠️ 您的浏览器不支持语音识别功能
          </div>
          <div className="text-xs text-gray-500 mt-2">
            请使用Chrome、Edge、Safari等现代浏览器
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-blue-50', className)}>
      {/* 标题 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-blue-700 mb-1">普通语音转文字</h3>
        <p className="text-sm text-blue-600">基于浏览器Web Speech API • 免费 • 即时识别</p>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center space-x-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span>开始录音</span>
          </Button>
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
        
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-gray-600">
              录音中 {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {/* 实时识别结果显示 */}
      {(transcriptText || interimResults || isRecording) && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg border min-h-[120px]">
            <div className="text-sm text-gray-500 mb-2">识别结果：</div>
            <div className="space-y-2">
              {transcriptText && (
                <div className="text-gray-900">
                  {transcriptText}
                </div>
              )}
              {interimResults && (
                <div className="text-gray-500 italic">
                  {interimResults}...
                </div>
              )}
              {isRecording && !transcriptText && !interimResults && (
                <div className="text-gray-400">
                  请开始说话...
                </div>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleImportToEditor}
              disabled={!transcriptText.trim()}
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
              disabled={!transcriptText && !interimResults}
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
      <div className="text-xs text-blue-600 space-y-1">
        <div>
          • <strong>即时识别</strong>：说话时实时显示识别结果
        </div>
        <div>
          • <strong>连续识别</strong>：支持长时间连续语音输入
        </div>
        <div>
          • <strong>免费使用</strong>：基于浏览器本地处理，无需网络费用
        </div>
        <div>
          • <strong>隐私安全</strong>：语音数据不离开浏览器
        </div>
      </div>
    </div>
  );
}