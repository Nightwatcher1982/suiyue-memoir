'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { storageService } from '@/lib/cloudbase/storage';

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
  const [showResults, setShowResults] = useState<boolean>(false); // 控制结果框显示
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setError('');
      setTranscriptText('');
      setConfidence(0);
      setRealtimeText('');
      setConfirmedText('');
      setShowResults(false);
      // 重置ref状态
      confirmedTextRef.current = '';
      realtimeTextRef.current = '';
      // 重置去重集合
      processedSentencesRef.current.clear();
      
      // 配置音频参数以符合DashScope要求
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
      
      // 使用Web Audio API获取PCM数据
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // 获取单声道PCM数据
        
        // 转换为16位PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
        }
        
        console.log('🎵 获取PCM音频数据:', pcmData.byteLength, 'bytes');
        sendAudioToWebSocket(pcmData.buffer);
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // 保存引用用于清理
      audioContextRef.current = audioContext;
      processorRef.current = processor;
      
      // 同时保留MediaRecorder用于录音结束处理
      let mimeType = 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('💾 MediaRecorder数据收集:', event.data.size, 'bytes (用于录音文件)');
        }
      };
      
      mediaRecorder.onstop = async () => {
        // 清理Web Audio API资源
        if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processRealtimeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000); // 每秒收集一次音频数据用于实时传输
      setIsRecording(true);
      setRecordingTime(0);
      
      // 启动WebSocket实时识别
      await startRealtimeRecognition();
      
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

  // 实时语音识别WebSocket连接
  const wsRef = useRef<WebSocket | null>(null);
  const [realtimeText, setRealtimeText] = useState<string>(''); // 当前正在识别的文字（会被修正）
  const [confirmedText, setConfirmedText] = useState<string>(''); // 已确认的文字（累积保存）
  const [dashscopeReady, setDashscopeReady] = useState<boolean>(false);
  const dashscopeReadyRef = useRef<boolean>(false); // 使用ref确保立即可用
  const currentTaskIdRef = useRef<string>(''); // 使用ref确保立即可用
  
  // 使用ref来立即存储识别结果，避免React状态更新延迟问题
  const confirmedTextRef = useRef<string>('');
  const realtimeTextRef = useRef<string>('');
  
  // 用于去重的ref - 存储已经处理过的句子
  const processedSentencesRef = useRef<Set<string>>(new Set());

  // 真正的WebSocket实时识别
  const startRealtimeRecognition = async () => {
    try {
      console.log('🌐 启动WebSocket实时语音识别');
      
      // 连接到本地WebSocket代理服务器
      const proxyUrl = 'ws://localhost:8080/ws-proxy';
      console.log('🔗 连接到WebSocket代理:', proxyUrl);
      
      const ws = new WebSocket(proxyUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ WebSocket代理连接已建立，等待DashScope连接...');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📡 收到代理消息:', message);
          
          if (message.type === 'proxy-connected') {
            console.log('✅ DashScope连接已建立，发送初始化消息');
            
            // 发送DashScope标准初始化消息
            const taskId = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            currentTaskIdRef.current = taskId;
            
            const initMessage = {
              header: {
                action: 'run-task',
                streaming: 'duplex',
                task_id: taskId
              },
              payload: {
                model: 'paraformer-realtime-v2',
                task_group: 'audio',
                task: 'asr',
                function: 'recognition',
                input: {
                  audio_encoding: 'pcm',
                  sample_rate: 16000,
                  format: 'pcm'
                },
                parameters: {
                  language_hints: ['zh'],
                  max_sentence_silence: 800, // 句子间最大静默时间(ms)，控制句子分割
                  enable_words: true, // 开启词级别时间戳
                  enable_punctuation_prediction: true, // 开启标点符号预测
                  enable_inverse_text_normalization: true // 开启逆文本正规化
                }
              }
            };
            ws.send(JSON.stringify(initMessage));
            
          } else if (message.type === 'proxy-error') {
            console.error('❌ 代理错误:', message.error);
            throw new Error(`WebSocket代理错误: ${message.error}`);
            
          } else if (message.type === 'proxy-closed') {
            console.log('🔌 DashScope连接已关闭');
            
          } else {
            // 处理DashScope WebSocket响应格式
            console.log('📨 DashScope消息详情:', {
              event: message.header?.event,
              header: message.header,
              hasPayload: !!message.payload,
              hasOutput: !!(message.payload && message.payload.output),
              hasSentence: !!(message.payload && message.payload.output && message.payload.output.sentence),
              fullMessage: message
            });
            
            if (message.header && message.header.event === 'task-started') {
              console.log('🎯 DashScope任务已启动，现在可以发送音频数据');
              setDashscopeReady(true);
              dashscopeReadyRef.current = true; // 立即设置ref状态
            }
            
            if (message.payload && message.payload.output) {
              const output = message.payload.output;
              
              // 处理句子级识别结果
              if (output.sentence && output.sentence.text) {
                const sentence = output.sentence;
                console.log('📡 收到句子数据:', JSON.stringify(sentence, null, 2));
                
                // 检查是否为完整句子（必须同时满足：end_time不为null 且 sentence_end为true）
                const isFinalSentence = sentence.end_time !== null && sentence.sentence_end === true;
                console.log('🔍 句子状态:', {
                  text: sentence.text,
                  begin_time: sentence.begin_time,
                  end_time: sentence.end_time,
                  sentence_end: sentence.sentence_end,
                  isFinal: isFinalSentence
                });
                
                if (isFinalSentence) {
                  // 使用时间戳作为唯一标识，避免重复处理同一个句子
                  const sentenceKey = `${sentence.begin_time}-${sentence.end_time}`;
                  const sentenceText = sentence.text.trim();
                  
                  if (!processedSentencesRef.current.has(sentenceKey) && sentenceText) {
                    // 已确认的句子，累积到确认文字中
                    processedSentencesRef.current.add(sentenceKey);
                    setConfirmedText(prev => {
                      const newConfirmed = prev + sentenceText;
                      confirmedTextRef.current = newConfirmed; // 立即更新ref
                      console.log('✅ 确认句子:', sentenceText);
                      console.log('🔑 句子标识:', sentenceKey);
                      console.log('📝 累积确认文字:', newConfirmed);
                      return newConfirmed;
                    });
                    setRealtimeText(confirmedTextRef.current); // 显示已确认的文字
                    realtimeTextRef.current = confirmedTextRef.current;
                  } else {
                    console.log('⚠️ 重复句子，跳过:', sentenceText, '标识:', sentenceKey);
                  }
                } else {
                  // 中间识别结果，显示但不累积
                  // 实时文字显示：已确认文字 + 当前中间识别文字
                  const currentText = sentence.text.trim();
                  const fullRealtimeText = confirmedTextRef.current + currentText;
                  setRealtimeText(fullRealtimeText);
                  realtimeTextRef.current = fullRealtimeText; // 立即更新ref
                  console.log('🎯 中间识别:', currentText);
                  console.log('🔍 显示文字:', fullRealtimeText);
                }
              }
              
              // 处理完整转录结果（通常在结束时发送）
              if (output.transcription) {
                const transcriptionText = output.transcription.trim();
                console.log('🎯 收到完整转录:', transcriptionText);
                console.log('🔍 当前已确认文字:', confirmedTextRef.current);
                
                // 检查完整转录是否与已确认文字重复
                // 如果完整转录就是当前已确认文字，则跳过
                if (transcriptionText && transcriptionText !== confirmedTextRef.current.trim()) {
                  // 如果完整转录包含了已确认文字，只添加新增部分
                  let textToAdd = transcriptionText;
                  if (confirmedTextRef.current.trim() && transcriptionText.startsWith(confirmedTextRef.current.trim())) {
                    textToAdd = transcriptionText.substring(confirmedTextRef.current.trim().length);
                    console.log('🔄 检测到重叠，只添加新增部分:', textToAdd);
                  }
                  
                  if (textToAdd.trim()) {
                    setConfirmedText(prev => {
                      const newConfirmed = prev + textToAdd;
                      confirmedTextRef.current = newConfirmed; // 立即更新ref
                      console.log('📝 添加完整转录文字:', textToAdd);
                      console.log('📝 最终累积文字:', newConfirmed);
                      return newConfirmed;
                    });
                  }
                } else {
                  console.log('⚠️ 完整转录与已确认文字重复，跳过');
                }
                
                setRealtimeText('');
                realtimeTextRef.current = ''; // 立即更新ref
              }
            }
          }
        } catch (err) {
          console.error('❌ WebSocket消息解析失败:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket代理连接错误:', error);
        throw new Error('WebSocket代理连接失败');
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket代理连接已关闭, code:', event.code, 'reason:', event.reason);
        wsRef.current = null;
        setDashscopeReady(false);
        dashscopeReadyRef.current = false;
        currentTaskIdRef.current = '';
        // 注意：不在这里清空识别内容，让stopRealtimeRecognition来处理
      };
      
    } catch (err) {
      console.error('❌ WebSocket实时识别启动失败:', err);
      const errorMessage = err instanceof Error ? err.message : '实时识别启动失败';
      setError(errorMessage);
      throw err; // 直接抛出错误，不使用降级方案
    }
  };

  // 发送音频数据到WebSocket
  const sendAudioToWebSocket = (audioData: ArrayBuffer) => {
    console.log('🔍 检查WebSocket状态:', {
      wsExists: !!wsRef.current,
      wsState: wsRef.current?.readyState,
      dashscopeReady: dashscopeReady,
      dashscopeReadyRef: dashscopeReadyRef.current,
      audioSize: audioData.byteLength
    });
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // 检查DashScope是否准备好，使用ref确保立即可用
      if (dashscopeReadyRef.current) {
        try {
          // DashScope实时识别协议：直接发送二进制音频数据
          wsRef.current.send(audioData);
          console.log('✅ 成功发送音频数据到WebSocket:', audioData.byteLength, 'bytes');
        } catch (err) {
          console.error('❌ 发送音频数据失败:', err);
          throw err; // 直接抛出错误，不使用降级方案
        }
      } else {
        console.log('⏳ DashScope未准备好，跳过音频数据发送');
      }      
    } else {
      console.error('❌ WebSocket未连接，无法发送音频数据');
      throw new Error('WebSocket未连接');
    }
  };

  // 停止实时识别
  const stopRealtimeRecognition = () => {
    console.log('🛑 开始停止WebSocket实时识别');
    console.log('🔍 stopRealtimeRecognition函数开始时状态:', {
      confirmedText: confirmedText,
      realtimeText: realtimeText,
      confirmedTextLength: confirmedText?.length || 0,
      realtimeTextLength: realtimeText?.length || 0
    });
    
    if (wsRef.current) {
      console.log('🛑 WebSocket存在，发送停止消息');
      
      // 发送DashScope标准结束消息
      const endMessage = {
        header: {
          action: 'finish-task',
          task_id: currentTaskIdRef.current
        },
        payload: {
          input: {
            audio_encoding: 'pcm',
            sample_rate: 16000,
            format: 'pcm'
          }
        }
      };
      
      try {
        wsRef.current.send(JSON.stringify(endMessage));
        
        // 等待一小段时间让服务器处理停止消息，然后关闭连接
        setTimeout(() => {
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }, 1000);
        
        // 保存识别结果（优先使用confirmedText，备用realtimeText）
        // 使用ref获取最新值，避免React状态更新延迟
        const currentConfirmedText = confirmedTextRef.current;
        const currentRealtimeText = realtimeTextRef.current;
        
        console.log('🔍 停止录音时状态检查:', {
          confirmedText: confirmedText,
          realtimeText: realtimeText,
          confirmedTextRef: currentConfirmedText,
          realtimeTextRef: currentRealtimeText,
          confirmedTextLength: currentConfirmedText.length,
          realtimeTextLength: currentRealtimeText.length,
          confirmedTextTrim: currentConfirmedText.trim(),
          realtimeTextTrim: currentRealtimeText.trim()
        });
        
        let finalText = '';
        if (currentConfirmedText.trim()) {
          finalText = currentConfirmedText.trim();
          console.log('✅ 使用已确认识别结果:', finalText);
        } else if (currentRealtimeText.trim()) {
          // 实时文字现在可能包含完整内容，需要检查是否与已确认文字重复
          if (currentRealtimeText.trim() !== currentConfirmedText.trim()) {
            finalText = currentRealtimeText.trim();
            console.log('⚠️ 没有确认文字，使用最后实时识别结果:', finalText);
          } else {
            finalText = currentConfirmedText.trim();
            console.log('ℹ️ 实时文字与确认文字相同，使用确认文字:', finalText);
          }
        } else {
          console.log('⚠️ 没有任何识别内容');
        }
        
        setTranscriptText(finalText);
        if (finalText) {
          setConfidence(currentConfirmedText.trim() ? 0.95 : 0.8); // 确认文字置信度高，实时文字稍低
        }
        
        console.log('✅ 录音识别流程完成，等待用户手动导入编辑器');
        
        // 无论是否有内容，都显示结果框
        setShowResults(true);
        // 清空实时识别状态，但保留最终结果显示
        setRealtimeText('');
        setConfirmedText('');
        // 清空ref状态
        confirmedTextRef.current = '';
        realtimeTextRef.current = '';
        setIsProcessing(false);
        setDashscopeReady(false);
        dashscopeReadyRef.current = false;
        currentTaskIdRef.current = '';
        
        // 注意：不清空 transcriptText，让结果框保持显示
        
      } catch (err) {
        console.error('❌ 停止WebSocket识别失败:', err);
        // 强制关闭连接
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        throw err; // 直接抛出错误，不使用降级方案
      }
    }
  };

  // 处理录音完成后的WebSocket实时识别结果
  const processRealtimeAudio = async (audioBlob: Blob) => {
    try {
      console.log('🎤 录音完成，处理WebSocket实时识别结果');
      console.log('🔍 调用stopRealtimeRecognition之前状态:', {
        confirmedText: confirmedText,
        realtimeText: realtimeText,
        confirmedTextRef: confirmedTextRef.current,
        realtimeTextRef: realtimeTextRef.current,
        confirmedTextLength: confirmedText?.length || 0,
        realtimeTextLength: realtimeText?.length || 0,
        confirmedTextRefLength: confirmedTextRef.current?.length || 0,
        realtimeTextRefLength: realtimeTextRef.current?.length || 0
      });
      
      // 停止WebSocket连接并保存结果
      // stopRealtimeRecognition函数内部已经处理了结果保存
      stopRealtimeRecognition();
      
      console.log('✅ WebSocket实时识别流程完成');
      
    } catch (err) {
      console.error('实时语音识别失败:', err);
      const errorMessage = err instanceof Error ? err.message : '实时语音识别失败，请重试';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  // 处理音频文件识别
  const processFileAudio = async (audioBlob: Blob, model: string = 'sensevoice-v1') => {
    try {
      console.log(`🎤 开始处理音频，使用${model}模型...`);
      
      console.log('📊 音频信息:', {
        originalSize: audioBlob.size,
        audioType: audioBlob.type,
        duration: recordingTime
      });
      
      // 第一步：上传音频到CloudBase存储
      console.log('📤 正在上传音频到CloudBase存储...');
      const uploadResult = await storageService.uploadAudio(
        audioBlob, 
        'temp-user', // 临时用户ID，实际使用中应该获取真实用户ID
        'voice-recognition' // 章节ID
      );
      
      console.log('✅ 音频上传成功:', uploadResult);
      
      // 第二步：使用音频URL调用语音识别API
      console.log('🎤 调用DashScope文件识别API...');
      
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl: uploadResult.downloadUrl,
          recognitionType: 'file',
          uploadType: 'recording',
          duration: recordingTime.toString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '网络请求失败');
      }
      
      const result = await response.json();

      console.log('📡 DashScope语音识别API响应:', result);
      
      if (!result.success) {
        const errorDetail = result.error || result.message || '语音识别失败';
        console.error('❌ DashScope语音识别失败，详细错误:', errorDetail);
        throw new Error(errorDetail);
      }

      const recognizedText = result.text;
      const confidenceScore = result.confidence || 0.95;
      
      console.log('✅ DashScope语音识别成功:', recognizedText);
      console.log('🎯 置信度:', confidenceScore);
      
      if (!recognizedText || recognizedText.trim().length === 0) {
        throw new Error('未识别到语音内容，请重新录制');
      }
      
      setTranscriptText(recognizedText);
      setConfidence(confidenceScore);
      setIsProcessing(false);
      setRecordingTime(0);
      
      // 清理临时文件（可选）
      try {
        await storageService.deleteFile(uploadResult.fileId);
        console.log('🗑️ 临时音频文件已清理');
      } catch (cleanupError) {
        console.warn('⚠️ 清理临时文件失败:', cleanupError);
      }
      
    } catch (err) {
      console.error('DashScope语音转换失败:', err);
      const errorMessage = err instanceof Error ? err.message : 'DashScope语音转换失败，请重试';
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
      setRealtimeText('');
      setConfirmedText('');
      setShowResults(false);
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

      // 第一步：上传音频到CloudBase存储
      console.log('📤 正在上传音频文件到CloudBase存储...');
      const audioBlob = new Blob([file], { type: file.type });
      const uploadResult = await storageService.uploadAudio(
        audioBlob, 
        'temp-user', // 临时用户ID，实际使用中应该获取真实用户ID
        'voice-recognition' // 章节ID
      );
      
      console.log('✅ 音频文件上传成功:', uploadResult);
      setUploadProgress(50);

      // 第二步：使用音频URL调用语音识别API
      console.log('📁 调用DashScope文件语音识别API处理文件上传...');
      
      const response = await fetch('/api/voice-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl: uploadResult.downloadUrl,
          recognitionType: 'file', // 文件上传使用文件识别
          uploadType: 'file',
          duration: '0'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || '网络请求失败');
      }
      
      const result = await response.json();

      setUploadProgress(80);

      console.log('📡 文件上传API响应:', result);
      
      if (!result.success) {
        throw new Error(result.error || result.message || '语音识别失败');
      }

      console.log('✅ 文件上传语音识别成功:', result.text);
      setUploadProgress(100);
      
      setTranscriptText(result.text);
      setConfidence(result.confidence || 0.95);
      setShowResults(true);
      
      console.log('✅ 文件识别完成，等待用户手动导入编辑器');
      
      // 清理临时文件（可选）
      try {
        await storageService.deleteFile(uploadResult.fileId);
        console.log('🗑️ 临时音频文件已清理');
      } catch (cleanupError) {
        console.warn('⚠️ 清理临时文件失败:', cleanupError);
      }
      
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
      setShowResults(false);
      console.log('📝 专业识别文本已手动导入编辑器');
    }
  }, [transcriptText, onTranscriptionComplete]);

  // 清空文本
  const handleClearText = useCallback(() => {
    setTranscriptText('');
    setConfidence(0);
    setError('');
    setRealtimeText('');
    setConfirmedText('');
    setShowResults(false);
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
        <p className="text-sm text-purple-600">DashScope语音识别 • WebSocket代理实时识别+文件识别 • 无降级方案</p>
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

      {/* 实时识别文本显示 */}
      {isRecording && (confirmedText || realtimeText) && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
            实时识别：
          </div>
          <div className="text-gray-900 text-sm leading-relaxed space-y-1">
            {/* 已确认的文字（不会被修改） */}
            {confirmedText && (
              <div className="text-gray-800 font-medium">
                {confirmedText}
              </div>
            )}
            {/* 当前正在识别的文字（可能被修正） */}
            {realtimeText && (
              <div className="text-gray-600 italic">
                {realtimeText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 识别结果显示 */}
      {showResults && (
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
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              className="w-full text-gray-900 leading-relaxed resize-none border-0 bg-transparent focus:outline-none min-h-[80px]"
              placeholder="识别结果将显示在此处，您可以编辑修改..."
            />
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
          • <strong>双模式识别</strong>：录音使用WebSocket代理实时识别；文件上传使用异步识别
        </div>
        <div>
          • <strong>高精度识别</strong>：DashScope语音识别引擎，准确率可达95%以上
        </div>
        <div>
          • <strong>支持长音频</strong>：录音模式支持长时间录制，文件模式支持大文件(50MB)
        </div>
        <div>
          • <strong>智能优化</strong>：支持中英文混合识别，自动标点符号预测
        </div>
      </div>
    </div>
  );
}