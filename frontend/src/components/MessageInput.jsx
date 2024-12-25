import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, Video, Square } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { sendMessage } = useChatStore();

  const startRecording = async (mediaType) => {
    try {
      const constraints = {
        audio: mediaType === 'audio',
        video: mediaType === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, {
          type: mediaType === 'audio' ? 'audio/webm' : 'video/webm'
        });
        if (mediaType === 'audio') {
          setAudioBlob(blob);
        } else {
          setVideoBlob(blob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      if (mediaType === 'audio') {
        setIsRecordingAudio(true);
      } else {
        setIsRecordingVideo(true);
      }
    } catch (error) {
      toast.error(`Cannot access ${mediaType} device`);
    }
  };

  const stopRecording = (mediaType) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (mediaType === 'audio') {
        setIsRecordingAudio(false);
      } else {
        setIsRecordingVideo(false);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (type) => {
    if (type === 'image') {
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (type === 'audio') {
      setAudioBlob(null);
    } else if (type === 'video') {
      setVideoBlob(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob && !videoBlob) return;

    try {
      const messageData = {
        text: text.trim(),
        image: imagePreview,
      };

      if (audioBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          messageData.audio = reader.result;
          await sendMessage(messageData);
        };
      } else if (videoBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        reader.onloadend = async () => {
          messageData.video = reader.result;
          await sendMessage(messageData);
        };
      } else {
        await sendMessage(messageData);
      }

      // Clear form
      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setVideoBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={() => removeMedia('image')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {audioBlob && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <audio controls src={URL.createObjectURL(audioBlob)} className="h-10" />
            <button
              onClick={() => removeMedia('audio')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {videoBlob && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <video controls src={URL.createObjectURL(videoBlob)} className="max-w-[200px]" />
            <button
              onClick={() => removeMedia('video')}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${isRecordingAudio ? "text-red-500" : "text-zinc-400"}`}
            onClick={() => isRecordingAudio ? stopRecording('audio') : startRecording('audio')}
          >
            {isRecordingAudio ? <Square size={20} /> : <Mic size={20} />}
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${isRecordingVideo ? "text-red-500" : "text-zinc-400"}`}
            onClick={() => isRecordingVideo ? stopRecording('video') : startRecording('video')}
          >
            {isRecordingVideo ? <Square size={20} /> : <Video size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob && !videoBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;