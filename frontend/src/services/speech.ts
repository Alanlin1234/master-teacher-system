/** 浏览器原生 Web Speech 语音播报与麦克风拾音服务 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void, onBoundary?: () => void) {
    if (!this.synth) return;
    this.stop();

    // 过滤掉 markdown 和 LaTeX 符号，使得朗读更自然
    const cleanText = text
      .replace(/\$\$[\s\S]*?\$\$/g, "公式")
      .replace(/\$[^$]+\$/g, "公式")
      .replace(/[#*`_>~-]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .slice(0, 300);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "zh-CN";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    utterance.onboundary = () => onBoundary?.();

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }

  startListening(onResult: (text: string) => void, onError?: (err: any) => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.(new Error("当前浏览器不支持原生语音识别，请直接键入文本"));
      return null;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "zh-CN";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) onResult(transcript);
      };
      rec.onerror = (e: any) => onError?.(e);
      rec.start();
      this.recognition = rec;
      return rec;
    } catch (e) {
      onError?.(e);
      return null;
    }
  }

  stopListening() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
  }
}

export const speechService = new SpeechService();
