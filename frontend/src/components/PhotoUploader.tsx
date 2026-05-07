import { useCallback, useRef, useState } from "react";

interface Props {
  onPhotoSelected: (file: File, previewUrl: string, isVideo: boolean) => void;
  previewUrl: string | null;
  isVideo: boolean;
}

export default function PhotoUploader({ onPhotoSelected, previewUrl, isVideo }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      if (!isImg && !isVid) return;
      const url = URL.createObjectURL(file);
      onPhotoSelected(file, url, isVid);
    },
    [onPhotoSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
        ${dragging ? "border-brand-500 bg-brand-50 scale-[1.01]" : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"}
        ${previewUrl ? "border-solid border-brand-400" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {previewUrl ? (
        <div className="relative">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-full h-64 object-cover rounded-2xl bg-black"
              controls
              muted
              playsInline
            />
          ) : (
            <img
              src={previewUrl}
              alt="תמונה שנבחרה"
              className="w-full h-64 object-cover rounded-2xl"
            />
          )}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {isVideo ? "🎥 וידאו" : "📸 תמונה"}
          </div>
          {!isVideo && (
            <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-xl">
                לחץ להחלפה
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-400">
          <div className="flex gap-3">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-600 text-lg">גרור תמונה או וידאו</p>
            <p className="text-sm mt-1">או לחץ לבחירה מהגלריה</p>
            <p className="text-xs mt-2 text-slate-400">
              💡 וידאו של 10-30 שניות יספק עיצוב הרבה יותר מדויק
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
