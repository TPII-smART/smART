"use client";

import type React from "react";
import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/Card";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, CloudArrowUpIcon, DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

const acceptedFileTypesMapper = {
  Image: ["image/png", "image/jpeg", "image/jpg"],
  Video: ["video/mp4", "video/webm"],
  Audio: ["audio/mpeg", "audio/wav"],
  Document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

interface FileUploadProps {
  onUploadSuccess?: (file: File) => void; // Callback for successful upload, it loads the File in the parent component
  onUploadError?: (error: string) => void;
  acceptedFileType?: string; // e.g., Image, Video, Audio, Document
  maxFileSize?: number; // in bytes
  currentFile?: File | null; // Add current file prop
  onFileRemove?: () => void; // Add callback for file removal
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const dropzoneVariants = {
  idle: {
    scale: 1,
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-surface)",
  },
  dragging: {
    scale: 1.02,
    borderColor: "var(--color-accent)",
    backgroundColor: "color-mix(in srgb, var(--color-accent) 5%, transparent)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const iconVariants = {
  idle: { y: 0, scale: 1 },
  dragging: {
    y: -5,
    scale: 1.1,
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse" as const,
      duration: 1,
      ease: "easeInOut" as const,
    },
  },
};

const progressVariants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: (progress: number) => ({
    pathLength: progress / 100,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  }),
};

const successIconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  acceptedFileType,
  maxFileSize = 25 * 1024 * 1024, // Default --> 25MB
  currentFile: initialFile = null,
  onFileRemove,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = useMemo(() => {
    return acceptedFileType
      ? (acceptedFileTypesMapper[acceptedFileType as keyof typeof acceptedFileTypesMapper] as string[])
      : [];
  }, [acceptedFileType]);

  // Creates a preview of the file if it's an image
  useEffect(() => {
    if (file?.type?.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    return () => setPreviewUrl(null);
  }, [file]);

  const formatBytes = useCallback((bytes: number, decimals = 2): string => {
    if (!+bytes) return "0 Bytes"; // Use !+bytes to handle possible non-numeric input gracefully

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Ensure index is within bounds
    const unit = sizes[i] || sizes[sizes.length - 1];

    return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
  }, []);

  const handleFileValidation = useCallback(
    (selectedFile: File): boolean => {
      setError(null); // Reset error before validation
      if (acceptedFileTypes && acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(selectedFile.type)) {
        const err = `Invalid file type. Accepted: ${acceptedFileTypes
          .map(t => t.split("/")[1])
          .join(", ")
          .toUpperCase()}`;
        setError(err);
        setStatus("error");
        if (onUploadError) onUploadError(err);
        return false;
      }
      if (maxFileSize && selectedFile.size > maxFileSize) {
        const err = `File size exceeds the limit of ${formatBytes(maxFileSize)}.`;
        setError(err);
        setStatus("error");
        if (onUploadError) onUploadError(err);
        return false;
      }
      return true;
    },
    [acceptedFileTypes, maxFileSize, onUploadError, formatBytes],
  );

  const onFileSelected = useCallback(
    (uploadingFile: File) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 10 + 10; // Simulate progress increments
        if (currentProgress >= 100) {
          clearInterval(interval);
          setProgress(100);
          setStatus("success");
          if (onUploadSuccess) {
            onUploadSuccess(uploadingFile);
          }
        } else {
          // Check if still in uploading state before updating progress
          setStatus(prevStatus => {
            if (prevStatus === "uploading") {
              setProgress(currentProgress);
              return "uploading";
            }
            // If status changed (e.g., user clicked reset), stop the simulation
            clearInterval(interval);
            return prevStatus;
          });
        }
      }, 200); // Adjust interval for simulation speed
    },
    [onUploadSuccess],
  );

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) return;

      if (!handleFileValidation(selectedFile)) {
        setFile(null); // Clear invalid file
        // Keep the error state active
        return;
      }

      setFile(selectedFile);
      setError(null);
      setStatus("uploading");
      setProgress(0);
      onFileSelected(selectedFile);
    },
    [handleFileValidation, onFileSelected],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status !== "uploading" && status !== "success") {
        setStatus("dragging");
      }
    },
    [status],
  ); // Depend on status

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "dragging") {
        setStatus("idle");
      }
    },
    [status],
  ); // Depend on status

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading" || status === "success") return; // Don't allow drop during/after upload

      setStatus("idle");
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [status, handleFileSelect],
  ); // Add dependencies

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      handleFileSelect(selectedFile || null);
      // Reset input value to allow selecting the same file again
      if (e.target) e.target.value = "";
    },
    [handleFileSelect],
  );

  const triggerFileInput = () => {
    if (status === "uploading" || status === "success") return; // Prevent opening dialog when not idle/error
    fileInputRef.current?.click();
  };

  const resetState = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    // No need to reset fileInputRef.current.value here, handled in handleFileInputChange
  };

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setPreviewUrl(null);
    if (onFileRemove) onFileRemove();
  }, [onFileRemove]);

  return (
    <motion.div variants={cardVariants} initial="initial" animate="animate" exit="exit" className="relative">
      <Card
        className="w-full max-w-md mx-auto overflow-hidden min-h-[250px] flex flex-col shadow-lg"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "color-mix(in srgb, var(--color-border) 50%, transparent)",
          boxShadow: "var(--shadow-center)",
        }}
      >
        <CardContent className="p-6 flex-1 flex flex-col items-center justify-center text-center relative">
          <div className="relative z-10 w-full">
            <AnimatePresence mode="wait" initial={false}>
              {file && (status === "success" || status !== "uploading") ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="flex flex-col items-center text-center w-full"
                  aria-live="polite"
                >
                  {previewUrl && (
                    <motion.div
                      className="relative w-32 h-32 mb-4 rounded-lg overflow-hidden ring-2"
                      // style={{
                      // ringColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                      // }}
                      initial={{
                        rotate: -10,
                        scale: 0.9,
                      }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Image
                        src={previewUrl}
                        width={128}
                        height={128}
                        alt={`Preview of ${file.name}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 z-20 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
                        aria-label="Remove file"
                        style={{ lineHeight: 0 }}
                      >
                        <XMarkIcon className="w-5 h-5 text-white" />
                      </button>
                    </motion.div>
                  )}
                  {!previewUrl && (
                    <DocumentIcon
                      className="w-16 h-16 mb-4"
                      style={{ color: "var(--color-accent)" }}
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-primary-content)" }}>
                    Current File
                  </h3>
                  <div
                    className="w-full max-w-xs rounded-lg p-3 mb-4 backdrop-blur-sm"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-secondary) 30%, transparent)",
                    }}
                  >
                    <p
                      className="text-sm font-medium mb-2 truncate"
                      style={{ color: "var(--color-primary-content)" }}
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: "color-mix(in srgb, var(--color-primary-content) 60%, transparent)" }}>
                          Size
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "color-mix(in srgb, var(--color-primary-content) 80%, transparent)" }}
                        >
                          {formatBytes(file.size)}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: "color-mix(in srgb, var(--color-primary-content) 60%, transparent)" }}>
                          Type
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "color-mix(in srgb, var(--color-primary-content) 80%, transparent)" }}
                        >
                          {file.type.split("/")[1].toUpperCase() || "Unknown"}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: "color-mix(in srgb, var(--color-primary-content) 60%, transparent)" }}>
                          Modified
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "color-mix(in srgb, var(--color-primary-content) 80%, transparent)" }}
                        >
                          {new Date(file.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span style={{ color: "color-mix(in srgb, var(--color-primary-content) 60%, transparent)" }}>
                          Status
                        </span>
                        <span className="font-medium" style={{ color: "var(--color-success)" }}>
                          Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : status === "idle" || status === "dragging" ? (
                <motion.div
                  key="dropzone"
                  variants={dropzoneVariants}
                  initial="idle"
                  animate={status === "dragging" ? "dragging" : "idle"}
                  className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg group cursor-pointer transition-all duration-500 ease-in-out backdrop-blur-sm relative overflow-hidden hover:border-accent"
                  style={{
                    borderColor:
                      status === "dragging"
                        ? "var(--color-accent)"
                        : "color-mix(in srgb, var(--color-border) 50%, transparent)",
                    backgroundColor:
                      status === "dragging" ? "color-mix(in srgb, var(--color-accent) 5%, transparent)" : "transparent",
                    // "--hover-border-color": "var(--color-accent)",
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      triggerFileInput();
                    }
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (status !== "dragging") {
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                      e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-accent) 2%, transparent)";
                      // Change icon color
                      const icon = e.currentTarget.querySelector(".upload-icon") as HTMLElement;
                      if (icon) icon.style.color = "var(--color-accent)";
                      // Change text color
                      const text = e.currentTarget.querySelector(".upload-text-accent") as HTMLElement;
                      if (text) text.style.color = "var(--color-accent)";
                    }
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (status !== "dragging") {
                      e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-border) 50%, transparent)";
                      e.currentTarget.style.backgroundColor = "transparent";
                      // Reset icon color
                      const icon = e.currentTarget.querySelector(".upload-icon") as HTMLElement;
                      if (icon) icon.style.color = "color-mix(in srgb, var(--color-primary-content) 40%, transparent)";
                      // Reset text color
                      const text = e.currentTarget.querySelector(".upload-text-accent") as HTMLElement;
                      if (text) text.style.color = "color-mix(in srgb, var(--color-accent) 90%, transparent)";
                    }
                  }}
                  aria-label="File upload dropzone"
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div
                        className="absolute inset-0 animate-shimmer"
                        style={{
                          background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-accent) 2%, transparent), transparent, color-mix(in srgb, var(--color-accent) 2%, transparent))`,
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--color-accent) 3%, transparent), transparent 70%)`,
                        }}
                      />
                    </div>
                  </div>
                  <motion.div
                    variants={iconVariants}
                    initial="idle"
                    animate={status === "dragging" ? "dragging" : "idle"}
                    className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-500"
                  >
                    <CloudArrowUpIcon
                      className="w-12 h-12 mb-4 transition-all duration-500 ease-out upload-icon"
                      style={{
                        color:
                          status === "dragging"
                            ? "var(--color-accent)"
                            : "color-mix(in srgb, var(--color-primary-content) 40%, transparent)",
                      }}
                      aria-label="Upload cloud icon"
                    />
                  </motion.div>
                  <p
                    className="mb-2 text-sm transition-all duration-500"
                    style={{ color: "color-mix(in srgb, var(--color-primary-content) 70%, transparent)" }}
                  >
                    <span
                      className="font-semibold transition-colors duration-500 upload-text-accent"
                      style={{ color: "color-mix(in srgb, var(--color-accent) 90%, transparent)" }}
                    >
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p
                    className="text-xs transition-colors duration-500 group-hover:opacity-80"
                    style={{ color: "color-mix(in srgb, var(--color-primary-content) 50%, transparent)" }}
                  >
                    {acceptedFileTypes && acceptedFileTypes.length > 0
                      ? `Accepted: ${acceptedFileTypes
                          .map(t => t.split("/")[1])
                          .join(", ")
                          .toUpperCase()}`
                      : "SVG, PNG, JPG or GIF"}{" "}
                    {/* Default text */}
                    {maxFileSize && ` (Max ${formatBytes(maxFileSize)})`}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={handleFileInputChange}
                    accept={acceptedFileTypes?.join(",")}
                    aria-label="File input"
                  />
                </motion.div>
              ) : status === "uploading" && file ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="w-full flex flex-col items-center"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                    <motion.svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 36 36"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      aria-label="Upload progress indicator"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="color-mix(in srgb, var(--color-primary-content) 10%, transparent)"
                        strokeWidth="2.5"
                      />
                      <motion.circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="2.5"
                        strokeDasharray="100"
                        variants={progressVariants}
                        initial="initial"
                        animate="animate"
                        custom={progress}
                      />
                    </motion.svg>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    >
                      <DocumentIcon
                        className="w-8 h-8 absolute"
                        style={{ color: "var(--color-accent)" }}
                        aria-hidden="true"
                      />
                    </motion.div>
                  </div>
                  <p
                    className="text-sm font-medium mb-1 truncate max-w-[200px]"
                    style={{ color: "var(--color-primary-content)" }}
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "color-mix(in srgb, var(--color-primary-content) 60%, transparent)" }}
                  >
                    Uploading... {Math.round(progress)}%
                  </p>
                  <button
                    onClick={resetState}
                    type="button"
                    className="mt-4 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-300"
                    style={{
                      color: "var(--color-error)",
                      borderColor: "color-mix(in srgb, var(--color-error) 20%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--color-error) 5%, transparent)",
                    }}
                    aria-label="Cancel upload"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : status === "success" && file ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="flex flex-col items-center text-center"
                  aria-live="polite"
                >
                  <div className="relative mb-4">
                    <motion.div
                      className="absolute inset-0 blur-2xl rounded-full"
                      style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 10%, transparent)" }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.5 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                    />
                    <motion.div variants={successIconVariants} initial="initial" animate="animate">
                      <CheckCircleIcon
                        className="w-16 h-16 relative z-10 drop-shadow-lg"
                        style={{ color: "var(--color-success)" }}
                        aria-label="Success"
                      />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-primary-content)" }}>
                    Upload Successful!
                  </h3>
                  <p
                    className="text-sm mb-4 truncate max-w-[200px]"
                    style={{ color: "color-mix(in srgb, var(--color-primary-content) 70%, transparent)" }}
                    title={file.name}
                  >
                    {file.name} ({formatBytes(file.size)})
                  </p>
                  <button
                    onClick={resetState}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      boxShadow: "0 4px 14px 0 color-mix(in srgb, var(--color-accent) 20%, transparent)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "var(--color-accent-hover)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "var(--color-accent)";
                    }}
                    aria-label="Upload another file"
                  >
                    Upload Another File
                  </button>
                </motion.div>
              ) : status === "error" ? (
                <motion.div
                  key="error"
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    rotate: -10,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    rotate: 10,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="flex flex-col items-center text-center"
                  style={{ color: "var(--color-error)" }}
                  role="alert"
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{
                      rotate: [0, -10, 10, -10, 10, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                  >
                    <XMarkIcon className="w-12 h-12 mb-3" aria-hidden="true" />
                  </motion.div>
                  <p className="text-sm font-medium mb-1">Upload Failed</p>
                  <p className="text-xs mb-4 max-w-xs">{error || "An unknown error occurred."}</p>
                  <button
                    onClick={resetState}
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      color: "color-mix(in srgb, var(--color-primary-content) 80%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--color-secondary) 60%, transparent)",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        "color-mix(in srgb, var(--color-secondary) 80%, transparent)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        "color-mix(in srgb, var(--color-secondary) 60%, transparent)";
                    }}
                    aria-label="Try uploading again"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
