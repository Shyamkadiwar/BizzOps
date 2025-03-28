import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const token = localStorage.getItem('accessToken')

function NoteTable() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getNotes = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notes/get-notes`, {headers:{'Authorization':token} ,withCredentials: true });
            if (response.data.statusCode === 200) {
                setNotes(response.data.data.notes);
            }
        } catch (error) {
            console.error("Error while fetching notes", error.response?.data || error.message);
        }
    };

    const deleteNote = async (noteId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notes/delete-notes`, 
                { noteId }, 
                { headers:{'Authorization':token},withCredentials: true }
            );
            if (response.data.statusCode === 200) {
                closeModal();
                setNotes(notes.filter(note => note._id !== noteId));
            }
        } catch (error) {
            console.error("Error while deleting note", error.response?.data || error.message);
        }
    };

    useEffect(() => {
        getNotes();
    }, []);

    const openModal = (note) => {
        setSelectedNote(note);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedNote(null);
    };

    return (
        <div className="w-full rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Notes </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.length > 0 ? (
                    notes.map((noteItem) => (
                        <div key={noteItem._id} className="bg-[#222224] shadow-xl    hover:bg-[#28282B] transition-all duration-200 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h1 className="text-lg m-2 mb-3 font-poppins font-bold text-white">{noteItem.title}</h1>
                                <p className="text-sm m-2 text-white font-poppins">{noteItem.content.slice(0, 30)} . . .</p>
                            </div>
                            <FontAwesomeIcon
                                className="text-white hover:text-gray-400 cursor-pointer"
                                icon={faEllipsis}
                                onClick={() => openModal(noteItem)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full font-poppins text-center py-4 text-gray-600">
                        No notes available.
                    </div>
                )}
            </div>

            {isModalOpen && selectedNote && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-[#1d1d20] p-8 rounded-lg shadow-lg max-w-lg sm:w-full w-4/5 relative">
                        <h2 className="text-2xl text-white font-semibold mb-4 font-poppins">Note Details</h2>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-300 mb-2 font-poppins">{selectedNote.title}</h3>
                            <p className="text-gray-400 font-poppins">{selectedNote.content}</p>
                        </div>
                        <div className="mt-6 flex justify-end gap-6">
                            <button
                                className="text-white font-semibold text-lg font-poppins"
                                onClick={closeModal}
                            >
                                Close
                            </button>
                            <button
                                className="text-red-500 font-semibold text-lg font-poppins"
                                onClick={() => deleteNote(selectedNote._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NoteTable;