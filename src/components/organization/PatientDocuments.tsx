import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  File,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePatientDocuments,
  PatientDocument,
  PatientDocumentInsert,
  PatientDocumentStatus,
  DOCUMENT_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from "@/hooks/usePatientDocuments";
import { toast } from "sonner";
import { useAppData } from "@/hooks/useAppData";

interface PatientDocumentsProps {
  patientId: string;
  patientName?: string;
}

export function PatientDocuments({
  patientId,
  patientName,
}: PatientDocumentsProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PatientDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { member } = useAppData();

  const {
    documents,
    documentsLoading,
    uploadDocument,
    updateDocument,
    deleteDocument,
    uploadingDocument,
    updatingDocument,
    deletingDocument,
    formatFileSize,
    getDocumentTypeInfo,
    getStatusInfo,
    DOCUMENT_TYPE_OPTIONS: typeOptions,
    STATUS_OPTIONS: statusOptions,
  } = usePatientDocuments({ patientId });

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_name: "",
    document_type: "other" as PatientDocument["document_type"],
    description: "",
    tags: "",
    status: "pending" as PatientDocumentStatus,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    document_name: "",
    document_type: "other" as PatientDocument["document_type"],
    description: "",
    tags: "",
    status: "pending" as PatientDocumentStatus,
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesType =
      filterType === "all" || doc.document_type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle file selection (only store the file, don't upload yet)
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-fill document name if empty
    if (!uploadForm.document_name) {
      setUploadForm((prev) => ({
        ...prev,
        document_name: file.name,
      }));
    }
  };

  // Handle actual upload when user clicks the button
  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    try {
      const tagsArray = uploadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const documentData: Omit<
        PatientDocumentInsert,
        "document_url" | "file_size" | "mime_type"
      > = {
        patient_id: patientId,
        document_name: uploadForm.document_name || file.name,
        document_type: uploadForm.document_type,
        description: uploadForm.description || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        status: uploadForm.status,
        uploaded_by: member?.id || null,
        is_latest: true,
        version: 1,
      };

      await uploadDocument(file, documentData);

      // Reset form
      setUploadForm({
        document_name: "",
        document_type: "other",
        description: "",
        tags: "",
        status: "pending",
      });
      setUploadDialogOpen(false);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Handle edit document
  const handleEditDocument = (document: PatientDocument) => {
    setEditingDocument(document);
    setEditForm({
      document_name: document.document_name,
      document_type: document.document_type,
      description: document.description || "",
      tags: document.tags?.join(", ") || "",
      status: (document.status as PatientDocumentStatus) || "pending",
    });
    setEditDialogOpen(true);
  };

  // Handle update document
  const handleUpdateDocument = () => {
    if (!editingDocument) return;

    const tagsArray = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    updateDocument({
      id: editingDocument.id,
      updates: {
        document_name: editForm.document_name,
        document_type: editForm.document_type,
        description: editForm.description || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        status: editForm.status,
      },
    });

    setEditDialogOpen(false);
    setEditingDocument(null);
  };

  // Handle delete document
  const handleDeleteDocument = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(documentId);
    }
  };

  // Handle download document
  const handleDownloadDocument = (document: PatientDocument) => {
    window.open(document.document_url, "_blank");
  };

  // Get status badge color - Fixed to handle string status
  const getStatusBadgeVariant = (status: string | null) => {
    const statusInfo = getStatusInfo(status);
    switch (statusInfo.color) {
      case "green":
        return "default";
      case "yellow":
        return "secondary";
      case "red":
        return "destructive";
      case "blue":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (documentsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <p className="text-sm text-gray-600">
            {documents.length} document{documents.length !== 1 ? "s" : ""} for{" "}
            {patientName || "this patient"}
          </p>
        </div>
        <Button
          onClick={() => setUploadDialogOpen(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 mb-4">
                {documents.length === 0
                  ? "Upload the first document for this patient"
                  : "Try adjusting your search or filters"}
              </p>
              {documents.length === 0 && (
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Upload Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => {
                  const typeInfo = getDocumentTypeInfo(document.document_type);
                  const statusInfo = getStatusInfo(document.status);

                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {document.document_name}
                          </div>
                          {document.description && (
                            <div className="text-sm text-gray-600 truncate max-w-[300px]">
                              {document.description}
                            </div>
                          )}
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {document.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {document.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{document.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeInfo.icon}</span>
                          <span className="text-sm">{typeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(document.status)}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(document.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownloadDocument(document)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditDocument(document)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteDocument(document.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document for {patientName || "this patient"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File *</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelection}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.csv,.xlsx"
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT, CSV, XLSX
              </p>
            </div>

            <div>
              <Label htmlFor="document_name">Document Name</Label>
              <Input
                id="document_name"
                value={uploadForm.document_name}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    document_name: e.target.value,
                  }))
                }
                placeholder="Leave empty to use filename"
              />
            </div>

            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    document_type: value as PatientDocument["document_type"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={uploadForm.status || "pending"}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    status: value as PatientDocumentStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description..."
                className="min-h-[60px]"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadForm.tags}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={uploadingDocument}
              type="button"
              onClick={async () => {
                if (!fileInputRef.current?.files?.[0]) {
                  fileInputRef.current?.click();
                } else {
                  await handleFileUpload();
                }
              }}
            >
              {uploadingDocument
                ? "Uploading..."
                : !fileInputRef.current?.files?.[0]
                ? "Select File"
                : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document details and metadata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_document_name">Document Name</Label>
              <Input
                id="edit_document_name"
                value={editForm.document_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    document_name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit_document_type">Document Type</Label>
              <Select
                value={editForm.document_type}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    document_type: value as PatientDocument["document_type"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={editForm.status || "pending"}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    status: value as PatientDocumentStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description..."
                className="min-h-[60px]"
              />
            </div>

            <div>
              <Label htmlFor="edit_tags">Tags</Label>
              <Input
                id="edit_tags"
                value={editForm.tags}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={updatingDocument} onClick={handleUpdateDocument}>
              {updatingDocument ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
