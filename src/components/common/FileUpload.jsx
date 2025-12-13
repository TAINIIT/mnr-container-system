import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from './Toast';
import './FileUpload.css';

export default function FileUpload({
    files = [],
    onFilesChange,
    maxFiles = 10,
    accept = 'image/*',
    disabled = false
}) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
        e.target.value = ''; // Reset input
    };

    const processFiles = (newFiles) => {
        // Filter valid files
        const validFiles = newFiles.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error(`${file.name} exceeds 5MB limit`);
                return false;
            }
            return true;
        });

        if (files.length + validFiles.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Convert to base64 for localStorage storage
        const promises = validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: reader.result,
                        uploadedAt: new Date().toISOString()
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(processedFiles => {
            onFilesChange([...files, ...processedFiles]);
            toast.success(`${processedFiles.length} file(s) uploaded`);
        });
    };

    const removeFile = (fileId) => {
        onFilesChange(files.filter(f => f.id !== fileId));
    };

    return (
        <div className="file-upload">
            <div
                className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <Upload size={32} />
                <p>Drag & drop images here or click to browse</p>
                <span className="upload-hint">Max {maxFiles} files, 5MB each</span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />
            </div>

            {files.length > 0 && (
                <div className="upload-preview">
                    {files.map(file => (
                        <div key={file.id} className="preview-item">
                            <img src={file.data} alt={file.name} />
                            {!disabled && (
                                <button
                                    className="preview-remove"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <div className="preview-name">{file.name}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
