import React, { useState, useEffect } from "react";
import axios from "axios";
import { Chip, CircularProgress, TextField } from '@mui/material';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import MuiModal from "../shared/MuiModal";
import Layout from '../Layout.jsx';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';
import AlertDialog from '../shared/AlertDialog.jsx';

function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null });
    const [alertDialog, setAlertDialog] = useState({ open: false, title: "", message: "", severity: "info" });

    const [formData, setFormData] = useState({ title: '', content: '' });

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/notes/get-notes`,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setNotes(response.data.data.notes || []);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotes(); }, []);

    const handleAddNote = async () => {
        if (!formData.title || !formData.content) {
            setAlertDialog({ open: true, title: "Validation", message: "Title and Content are required", severity: "warning" });
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/notes/add-notes`,
                formData,
                { withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                setAlertDialog({ open: true, title: "Success", message: "Note added successfully", severity: "success" });
                setOpenAddModal(false);
                setFormData({ title: '', content: '' });
                fetchNotes();
            }
        } catch (error) {
            setAlertDialog({ open: true, title: "Error", message: "Error adding note", severity: "error" });
        }
    };

    const handleDelete = (noteId) => {
        setConfirmDialog({
            open: true, title: "Delete Note", message: "Are you sure you want to delete this note?",
            onConfirm: async () => {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/api/v1/notes/delete-notes`,
                        { noteId },
                        { withCredentials: true }
                    );
                    fetchNotes();
                    setViewModalOpen(false);
                } catch (error) { console.error('Error:', error); }
                setConfirmDialog({ ...confirmDialog, open: false });
            }
        });
    };

    const noteAccents = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
                        <p className="text-sm text-gray-600">{notes.length} notes</p>
                    </div>
                    <button
                        onClick={() => setOpenAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white"
                    >
                        <Plus size={18} /> Add Note
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <CircularProgress />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-12 shadow-lg text-center">
                        <StickyNote size={48} className="mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-700">No notes yet</h3>
                        <p className="text-sm text-gray-500">Create your first note to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((note, index) => {
                            const accent = noteAccents[index % noteAccents.length];
                            return (
                                <div
                                    key={note._id}
                                    onClick={() => { setSelectedNote(note); setViewModalOpen(true); }}
                                    className="bg-white/70 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                                >
                                    {/* Top accent bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{note.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Note Modal */}
            <MuiModal open={openAddModal} onClose={() => setOpenAddModal(false)} title="Add Note">
                <div className="flex flex-col gap-4 p-1">
                    <TextField label="Title *" value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth required />
                    <TextField label="Content *" value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })} fullWidth required multiline rows={5} />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setOpenAddModal(false)}
                            className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            Cancel
                        </button>
                        <button onClick={handleAddNote}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-white">
                            Add Note
                        </button>
                    </div>
                </div>
            </MuiModal>

            {/* View Note Modal */}
            <MuiModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title={selectedNote?.title || 'Note'}
                actions={
                    <>
                        <button onClick={() => handleDelete(selectedNote?._id)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500/80 to-rose-500/80 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg hover:from-red-600/90 hover:to-rose-600/90 transition-all duration-200 text-sm font-medium text-white">
                            Delete
                        </button>
                        <button onClick={() => setViewModalOpen(false)}
                            className="px-4 py-2 bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700">
                            Close
                        </button>
                    </>
                }
            >
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNote?.content}</p>
            </MuiModal>

            <ConfirmDialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={confirmDialog.onConfirm} title={confirmDialog.title} message={confirmDialog.message} />
            <AlertDialog open={alertDialog.open} onClose={() => setAlertDialog({ ...alertDialog, open: false })}
                title={alertDialog.title} message={alertDialog.message} severity={alertDialog.severity} />
        </Layout>
    );
}

export default Notes;