'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Video, FileText, Eye, ZoomIn, ZoomOut, Share2, Mail, Trash2, Edit3, Save, X, Play, Pause, RotateCcw } from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  description: string;
  timestamp: Date;
}

interface MediaShareInterfaceProps {
  onClose?: () => void;
}

export function MediaShareInterface({ onClose }: MediaShareInterfaceProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'viewer'>('gallery');
  const [zoom, setZoom] = useState(1);
  const [globalDescription, setGlobalDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleFileUpload = useCallback((files: FileList) => {
    setIsUploading(true);
    
    Array.from(files).forEach(file => {
      if (file.size > 250 * 1024 * 1024) { // 250MB limit
        alert(`Datei "${file.name}" ist zu groß (max. 250MB)`);
        return;
      }

      const url = URL.createObjectURL(file);
      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random(),
        file,
        url,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        name: file.name,
        size: file.size,
        description: '',
        timestamp: new Date()
      };

      setMediaFiles(prev => [...prev, mediaFile]);
    });

    setIsUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
    if (selectedFile?.id === id) {
      setSelectedFile(null);
      setViewMode('gallery');
    }
  };

  const openViewer = (file: MediaFile) => {
    setSelectedFile(file);
    setViewMode('viewer');
    setZoom(1);
  };

  const saveDescription = (id: string, description: string) => {
    setMediaFiles(prev => prev.map(file => 
      file.id === id ? { ...file, description } : file
    ));
    setEditingDescription(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateShareLink = () => {
    // In einer echten Implementierung würde das die Dateien hochladen und einen Link generieren
    const shareData = {
      files: mediaFiles.map(f => ({
        name: f.name,
        type: f.type,
        description: f.description
      })),
      globalDescription,
      timestamp: new Date().toISOString()
    };
    
    // Simulierter Share-Link
    const shareLink = `https://tierarzt.ai/share/${btoa(JSON.stringify(shareData)).slice(0, 10)}`;
    
    const subject = encodeURIComponent('Untersuchungsergebnisse von Dr. KI');
    const body = encodeURIComponent(`Liebe/r Tierbesitzer/in,

anbei finden Sie die Untersuchungsergebnisse Ihres Tieres.

${globalDescription ? `Allgemeine Bewertung:\n${globalDescription}\n\n` : ''}Link zu den Aufnahmen und Befunden:
${shareLink}

Die Aufnahmen enthalten:
${mediaFiles.map(f => `• ${f.name}${f.description ? `: ${f.description}` : ''}`).join('\n')}

Bei Fragen können Sie sich gerne jederzeit an uns wenden.

Mit freundlichen Grüßen,
Ihr Praxisteam`);

    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  if (viewMode === 'viewer' && selectedFile) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Viewer Header */}
        <div className="bg-black/90 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('gallery')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-medium">{selectedFile.name}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedFile.type === 'image' && (
              <>
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {selectedFile.type === 'image' ? (
            <img
              src={selectedFile.url}
              alt={selectedFile.name}
              className="max-w-full max-h-full object-contain cursor-zoom-in"
              style={{ transform: `scale(${zoom})` }}
              onClick={() => setZoom(zoom === 1 ? 2 : 1)}
            />
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                src={selectedFile.url}
                className="max-w-full max-h-full"
                controls
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
            </div>
          )}
        </div>

        {/* Description Editor */}
        <div className="bg-black/90 text-white p-4 border-t border-white/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {editingDescription === selectedFile.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Beschreibung zu dieser Aufnahme..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          saveDescription(selectedFile.id, tempDescription);
                          setTempDescription('');
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2 inline" />
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingDescription(null)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white/80 text-sm">
                      {selectedFile.description || 'Keine Beschreibung vorhanden'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingDescription(selectedFile.id);
                        setTempDescription(selectedFile.description);
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-2 inline" />
                      Beschreibung bearbeiten
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-100 border-b border-blue-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
            <Share2 className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-blue-900">Medien-Sharing</h2>
            <p className="text-xs text-blue-700">Untersuchungsergebnisse teilen</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-blue-700" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Upload Area */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Dateien hochladen</h3>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">
              Dateien hier hinziehen oder{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 hover:underline"
              >
                durchsuchen
              </button>
            </p>
            <p className="text-sm text-slate-500">
              Unterstützt: Bilder (JPG, PNG, GIF) und Videos (MP4, MOV, AVI) • Max. 250MB pro Datei
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Global Description */}
        {mediaFiles.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Allgemeine Bewertung</h3>
            <textarea
              value={globalDescription}
              onChange={(e) => setGlobalDescription(e.target.value)}
              placeholder="Allgemeine Bewertung der Untersuchung..."
              className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              rows={4}
            />
          </div>
        )}

        {/* Media Gallery */}
        {mediaFiles.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                Hochgeladene Dateien ({mediaFiles.length})
              </h3>
              {mediaFiles.length > 0 && (
                <button
                  onClick={generateShareLink}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Per E-Mail teilen
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => (
                <div key={file.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-100">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openViewer(file)}
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                        onClick={() => openViewer(file)}
                      >
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => openViewer(file)}
                        className="p-1 bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {file.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Video className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {file.name}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)} • {file.timestamp.toLocaleString()}
                    </p>

                    {/* Description */}
                    {editingDescription === file.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          placeholder="Beschreibung hinzufügen..."
                          className="w-full p-2 text-sm border border-slate-300 rounded resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              saveDescription(file.id, tempDescription);
                              setTempDescription('');
                            }}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={() => setEditingDescription(null)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium transition-colors"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                          {file.description || 'Keine Beschreibung'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingDescription(file.id);
                            setTempDescription(file.description);
                          }}
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Beschreibung bearbeiten
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {mediaFiles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Noch keine Dateien hochgeladen
            </h3>
            <p className="text-slate-600 mb-4">
              Laden Sie Bilder und Videos von Untersuchungen hoch, um sie mit Tierbesitzern zu teilen.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Erste Datei hochladen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}