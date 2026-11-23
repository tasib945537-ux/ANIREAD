import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API interface declarations for TypeScript compatibility
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseVoiceSearchOptions {
  onResult?: (transcript: string) => void;
  onInterimResult?: (interim: string) => void;
  onError?: (error: string) => void;
  currentLang?: string;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { onResult, onInterimResult, onError, currentLang = 'en' } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef(false);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechConstructor =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    setIsSupported(Boolean(SpeechConstructor));
  }, []);

  // Map UI language code to BCP-47 locale
  const getSpeechLocale = useCallback((lang: string): string => {
    switch (lang.toLowerCase()) {
      case 'bn':
        return 'bn-BD';
      case 'hi':
        return 'hi-IN';
      case 'ja':
        return 'ja-JP';
      case 'ko':
        return 'ko-KR';
      case 'es':
        return 'es-ES';
      case 'fr':
        return 'fr-FR';
      case 'de':
        return 'de-DE';
      case 'pt':
        return 'pt-BR';
      case 'it':
        return 'it-IT';
      case 'ru':
        return 'ru-RU';
      case 'ar':
        return 'ar-SA';
      case 'ta':
        return 'ta-IN';
      case 'te':
        return 'te-IN';
      case 'zh':
        return 'zh-CN';
      case 'id':
        return 'id-ID';
      case 'th':
        return 'th-TH';
      case 'vi':
        return 'vi-VN';
      default:
        return 'en-US';
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore already stopped error
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (overrideLocale?: string) => {
      const SpeechConstructor =
        typeof window !== 'undefined'
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (!SpeechConstructor) {
        const notSupportedMsg =
          'Voice search is not supported by your current browser. Please try Chrome, Edge, Safari, or Android Chrome.';
        setErrorMessage(notSupportedMsg);
        onError?.(notSupportedMsg);
        return;
      }

      // Stop previous instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      isManuallyStoppedRef.current = false;
      setErrorMessage(null);
      setInterimTranscript('');

      try {
        const recognition = new SpeechConstructor();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Set recognition language
        recognition.lang = overrideLocale || getSpeechLocale(currentLang);

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
            onInterimResult?.(interim);
          }

          if (final) {
            const cleanFinal = final.trim();
            setFinalTranscript(cleanFinal);
            setInterimTranscript('');
            onResult?.(cleanFinal);
            stopListening();
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          let userMsg = 'Could not recognize speech. Please try again.';

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            userMsg = 'Microphone permission was denied. Please allow microphone access in browser settings.';
          } else if (event.error === 'no-speech') {
            userMsg = 'No voice detected. Please speak clearly into your microphone.';
          } else if (event.error === 'network') {
            userMsg = 'Speech network error. Please check your internet connection.';
          } else if (event.error === 'aborted') {
            return;
          }

          setErrorMessage(userMsg);
          onError?.(userMsg);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition start error:', err);
        const startErrorMsg = 'Failed to activate microphone. Please try again.';
        setErrorMessage(startErrorMsg);
        onError?.(startErrorMsg);
        setIsListening(false);
      }
    },
    [currentLang, getSpeechLocale, onError, onInterimResult, onResult, stopListening]
  );

  const reset = useCallback(() => {
    stopListening();
    setInterimTranscript('');
    setFinalTranscript('');
    setErrorMessage(null);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    errorMessage,
    startListening,
    stopListening,
    reset,
  };
}
