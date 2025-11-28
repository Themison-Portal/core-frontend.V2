import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Check,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { DocumentTypeEnum } from "@/services/documentService";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  trialId: string;
  onUploadComplete?: (documents: any[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
}

const DOCUMENT_TYPES: { value: DocumentTypeEnum; label: string }[] = [
  { value: "protocol", label: "Protocol" },
  { value: "amendment", label: "Amendment" },
  { value: "plan", label: "Data Management Plan" },
  { value: "manual", label: "Study Manual" },
  { value: "brochure", label: "Investigator Brochure" },
  { value: "consent_form", label: "Informed Consent Form" },
  { value: "case_report_form", label: "Case Report Form" },
  { value: "standard_operating_procedure", label: "SOP" },
  { value: "other", label: "Other" },
];

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Individual file configuration interface
interface FileConfig {
  file: File;
  documentName: string;
  documentType: DocumentTypeEnum;
  description: string;
  amendmentNumber: string;
  tags: string;
  isEditingName: boolean;
}

export function DocumentUpload({
  trialId,
  onUploadComplete,
  onUploadError,
  disabled = false,
  maxFiles = 5,
  maxSizeBytes = MAX_FILE_SIZE,
}: DocumentUploadProps) {
  const [fileConfigs, setFileConfigs] = useState<FileConfig[]>([]);

  const {
    uploadMultipleDocuments,
    isUploading,
    uploadProgress,
    clearProgress,
  } = useDocumentUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > maxSizeBytes) {
          onUploadError?.(
            `File ${file.name} is too large (max ${
              maxSizeBytes / 1024 / 1024
            }MB)`
          );
          return false;
        }
        return true;
      });

      setFileConfigs((prev) => {
        const newConfigs = validFiles.map(
          (file): FileConfig => ({
            file,
            documentName: file.name,
            documentType: "other",
            description: "",
            amendmentNumber: "",
            tags: "",
            isEditingName: false,
          })
        );
        const combined = [...prev, ...newConfigs];
        return combined.slice(0, maxFiles);
      });
    },
    [maxFiles, maxSizeBytes, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles,
    disabled: disabled || isUploading,
  });

  const removeFile = (index: number) => {
    setFileConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileConfig = (index: number, updates: Partial<FileConfig>) => {
    setFileConfigs((prev) =>
      prev.map((config, i) =>
        i === index ? { ...config, ...updates } : config
      )
    );
  };

  const toggleEditName = (index: number) => {
    setFileConfigs((prev) =>
      prev.map((config, i) =>
        i === index
          ? { ...config, isEditingName: !config.isEditingName }
          : config
      )
    );
  };

  const handleUpload = async () => {
    if (fileConfigs.length === 0) {
      onUploadError?.("Please select at least one file");
      return;
    }

    // Validate all files have document types
    const invalidConfigs = fileConfigs.filter((config) => !config.documentType);
    if (invalidConfigs.length > 0) {
      onUploadError?.("Please select document type for all files");
      return;
    }

    try {
      const uploadOptions = fileConfigs.map((config) => ({
        file: new File([config.file], config.documentName, {
          type: config.file.type,
        }),
        trialId,
        documentType: config.documentType,
        description: config.description || undefined,
        tags: config.tags
          ? config.tags.split(",").map((tag) => tag.trim())
          : undefined,
        amendmentNumber: config.amendmentNumber
          ? parseInt(config.amendmentNumber)
          : undefined,
      }));

      const uploadedDocuments = await uploadMultipleDocuments(uploadOptions);

      // Clear form
      setFileConfigs([]);
      clearProgress();

      onUploadComplete?.(uploadedDocuments);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const hasFiles = fileConfigs.length > 0;
  const hasUploading = uploadProgress.some((p) => p.status === "uploading");

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed",
              hasFiles && "border-green-300 bg-green-50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {maxFiles} files, {formatFileSize(maxSizeBytes)} each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files to Upload */}
      {hasFiles && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">
              Files to Upload ({fileConfigs.length})
            </h3>
            <div className="space-y-6">
              {fileConfigs.map((config, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  {/* File Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex items-center space-x-2">
                        {config.isEditingName ? (
                          <div className="flex items-center space-x-1">
                            <Input
                              value={config.documentName}
                              onChange={(e) =>
                                updateFileConfig(index, {
                                  documentName: e.target.value,
                                })
                              }
                              className="h-8 text-sm font-medium min-w-48"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  toggleEditName(index);
                                }
                                if (e.key === "Escape") {
                                  updateFileConfig(index, {
                                    documentName: config.file.name,
                                  });
                                  toggleEditName(index);
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEditName(index)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateFileConfig(index, {
                                  documentName: config.file.name,
                                });
                                toggleEditName(index);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <XCircle className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <p className="font-medium text-sm">
                              {config.documentName}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEditName(index)}
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatFileSize(config.file.size)} •{" "}
                          {config.file.type.split("/")[1]?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor={`documentType-${index}`}
                        className="text-xs font-medium"
                      >
                        Document Type *
                      </Label>
                      <Select
                        value={config.documentType}
                        onValueChange={(value) =>
                          updateFileConfig(index, {
                            documentType: value as DocumentTypeEnum,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor={`amendmentNumber-${index}`}
                        className="text-xs font-medium"
                      >
                        Amendment Number
                      </Label>
                      <Input
                        id={`amendmentNumber-${index}`}
                        type="number"
                        value={config.amendmentNumber}
                        onChange={(e) =>
                          updateFileConfig(index, {
                            amendmentNumber: e.target.value,
                          })
                        }
                        placeholder="Optional"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`tags-${index}`}
                        className="text-xs font-medium"
                      >
                        Tags
                      </Label>
                      <Input
                        id={`tags-${index}`}
                        value={config.tags}
                        onChange={(e) =>
                          updateFileConfig(index, { tags: e.target.value })
                        }
                        placeholder="comma,separated,tags"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label
                      htmlFor={`description-${index}`}
                      className="text-xs font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id={`description-${index}`}
                      value={config.description}
                      onChange={(e) =>
                        updateFileConfig(index, { description: e.target.value })
                      }
                      placeholder="Optional description for this document"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Upload Progress</h3>
            <div className="space-y-3">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {progress.file.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      {progress.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {progress.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge
                        variant={
                          progress.status === "success"
                            ? "default"
                            : progress.status === "error"
                            ? "destructive"
                            : progress.status === "uploading"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {progress.status}
                      </Badge>
                    </div>
                  </div>
                  {progress.status === "uploading" && (
                    <Progress value={progress.progress} className="h-2" />
                  )}
                  {progress.status === "error" && progress.error && (
                    <p className="text-xs text-red-500">{progress.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {hasFiles && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={
              isUploading || fileConfigs.some((config) => !config.documentType)
            }
            size="lg"
            className="min-w-32"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {fileConfigs.length}{" "}
                {fileConfigs.length === 1 ? "File" : "Files"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
