export class CameraService {
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;

  async start(videoElement: HTMLVideoElement): Promise<void> {
    this.videoEl = videoElement;
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    videoElement.srcObject = this.stream;
    await videoElement.play();
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.videoEl) this.videoEl.srcObject = null;
  }

  captureFrame(): string | null {
    if (!this.videoEl) return null;
    const canvas = document.createElement('canvas');
    canvas.width = this.videoEl.videoWidth || 640;
    canvas.height = this.videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(this.videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1] || null;
  }

  isActive(): boolean {
    return !!(this.stream && this.stream.active);
  }
}

export const cameraService = new CameraService();
