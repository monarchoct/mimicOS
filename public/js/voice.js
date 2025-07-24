// Voice Management Module
export class VoiceManager {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isRecording = false;
        this.onTranscription = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.analyser = null;
    }
    
    async init() {
        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return false;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        // Setup recognition event handlers
        this.setupRecognitionHandlers();
        
        // Initialize audio context for visualization
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        return true;
    }
    
    setupRecognitionHandlers() {
        let finalTranscript = '';
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                    
                    // Send final transcript
                    if (this.onTranscription) {
                        this.onTranscription(finalTranscript.trim());
                    }
                    
                    finalTranscript = '';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update UI with interim results
            this.updateTranscriptionUI(interimTranscript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleRecognitionError(event.error);
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                // Restart if still recording
                this.recognition.start();
            }
        };
    }
    
    startRecording() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return;
        }
        
        this.isRecording = true;
        
        try {
            this.recognition.start();
            console.log('Started voice recording');
            
            // Also start media recording for audio data
            this.startMediaRecording();
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.isRecording = false;
        }
    }
    
    stopRecording() {
        this.isRecording = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        console.log('Stopped voice recording');
    }
    
    async startMediaRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.processAudioData(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Setup audio visualization
            this.setupAudioVisualization(stream);
            
            this.mediaRecorder.start();
        } catch (error) {
            console.error('Failed to access microphone:', error);
            this.handleMicrophoneError(error);
        }
    }
    
    setupAudioVisualization(stream) {
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        source.connect(this.analyser);
        
        // Start visualization
        this.visualizeAudio();
    }
    
    visualizeAudio() {
        if (!this.isRecording || !this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Update UI with volume level
        this.updateVolumeIndicator(average / 255);
        
        requestAnimationFrame(() => this.visualizeAudio());
    }
    
    updateVolumeIndicator(level) {
        // This would update a visual indicator in the UI
        const indicator = document.querySelector('.voice-level-indicator');
        if (indicator) {
            indicator.style.transform = `scaleY(${level})`;
        }
    }
    
    updateTranscriptionUI(text) {
        // Update the UI with interim transcription results
        const transcriptionElement = document.querySelector('.voice-transcription');
        if (transcriptionElement) {
            transcriptionElement.textContent = text;
        }
    }
    
    async processAudioData(audioBlob) {
        // In production, this would send audio to server for processing
        console.log('Audio recorded:', audioBlob.size, 'bytes');
        
        // For now, we'll just use the speech recognition results
        // In a real implementation, this could be sent to a more accurate STT service
    }
    
    async speak(text, voice = 'nova') {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }
            
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice settings
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to find matching voice
            const voices = this.synthesis.getVoices();
            const selectedVoice = this.selectVoice(voices, voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);
            
            this.synthesis.speak(utterance);
        });
    }
    
    selectVoice(voices, voiceType) {
        // Map voice types to preferred voice names
        const voiceMap = {
            'alloy': ['Google UK English Female', 'Microsoft Zira', 'Samantha'],
            'echo': ['Google UK English Male', 'Microsoft David', 'Alex'],
            'fable': ['Google UK English Female', 'Microsoft Hazel', 'Victoria'],
            'onyx': ['Google US English Male', 'Microsoft Mark', 'Fred'],
            'nova': ['Google US English Female', 'Microsoft Zira', 'Samantha'],
            'shimmer': ['Google US English Female', 'Microsoft Eva', 'Karen']
        };
        
        const preferredVoices = voiceMap[voiceType] || voiceMap['nova'];
        
        // Try to find a matching voice
        for (const voiceName of preferredVoices) {
            const voice = voices.find(v => v.name.includes(voiceName));
            if (voice) return voice;
        }
        
        // Fallback to first available voice
        return voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
    
    async playAudio(audioData) {
        try {
            // If audioData is base64, convert to blob
            let audioBlob;
            if (typeof audioData === 'string') {
                const response = await fetch(`data:audio/mp3;base64,${audioData}`);
                audioBlob = await response.blob();
            } else {
                audioBlob = audioData;
            }
            
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
            
            await audio.play();
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    }
    
    handleRecognitionError(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not available. Please check permissions.',
            'not-allowed': 'Microphone access denied. Please enable permissions.',
            'network': 'Network error. Please check your connection.',
            'aborted': 'Recording was cancelled.'
        };
        
        const message = errorMessages[error] || `Recognition error: ${error}`;
        this.showError(message);
    }
    
    handleMicrophoneError(error) {
        let message = 'Failed to access microphone.';
        
        if (error.name === 'NotAllowedError') {
            message = 'Microphone access denied. Please enable permissions in your browser.';
        } else if (error.name === 'NotFoundError') {
            message = 'No microphone found. Please connect a microphone.';
        }
        
        this.showError(message);
    }
    
    showError(message) {
        // This would show an error in the UI
        console.error('Voice error:', message);
        
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'voice-error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--error-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    getAvailableVoices() {
        return this.synthesis.getVoices();
    }
    
    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }
    
    isSupported() {
        return !!(
            (window.SpeechRecognition || window.webkitSpeechRecognition) &&
            window.speechSynthesis
        );
    }
}