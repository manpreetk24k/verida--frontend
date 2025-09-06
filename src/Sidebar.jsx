import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import "./Sidebar.css";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAllThreads = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const res = await response.json();
            console.log("API raw response:", res);

            // Process threads with better title handling
            const threadsMap = {};
            res.forEach(chat => {
                if (!threadsMap[chat.threadId]) {
                    // Create a more descriptive title
                    let title = "New Chat";
                    
                    // First try to get the message content
                    if (chat.message && typeof chat.message === 'string' && chat.message.trim().length > 0) {
                        title = chat.message.trim();
                    } 
                    // If message is empty but response exists, use response
                    else if (chat.response && typeof chat.response === 'string' && chat.response.trim().length > 0) {
                        title = chat.response.trim();
                    }
                    // If we have a different structure, try to find any text content
                    else if (chat.content) {
                        title = typeof chat.content === 'string' ? chat.content : JSON.stringify(chat.content);
                    }
                    // If neither exists but there's a threadId, use a portion of it
                    else if (chat.threadId) {
                        title = "Chat " + chat.threadId.slice(0, 8);
                    }
                    
                    // Truncate if too long
                    if (title.length > 28) {
                        title = title.slice(0, 25) + "...";
                    }
                    
                    threadsMap[chat.threadId] = {
                        threadId: chat.threadId,
                        title: title,
                        timestamp: chat.timestamp || chat.createdAt || new Date().toISOString()
                    };
                }
            });

            const filteredData = Object.values(threadsMap);
            // Sort by timestamp, newest first
            filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            console.log("Processed threads:", filteredData);
            setAllThreads(filteredData);
        } catch (err) {
            console.error("Error fetching threads:", err);
            setError("Failed to load chat history");
            
            // Fallback: Create some sample data for demonstration
            const sampleThreads = [
                { threadId: "1", title: "What is DSA?", timestamp: new Date().toISOString() },
                { threadId: "2", title: "Python programming tips", timestamp: new Date(Date.now() - 86400000).toISOString() },
                { threadId: "3", title: "Web development resources", timestamp: new Date(Date.now() - 172800000).toISOString() },
            ];
            setAllThreads(sampleThreads);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        const newThreadId = uuidv1();
        setCurrThreadId(newThreadId);
        setPrevChats([]);
        
        // Add the new thread to the list immediately
        setAllThreads(prev => [
            { threadId: newThreadId, title: "New Chat", timestamp: new Date().toISOString() },
            ...prev
        ]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${newThreadId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const res = await response.json();
            console.log("Thread messages:", res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.error(err);
            setError("Failed to load chat");
        }
    };

    const deleteThread = async (threadId) => {
        if (!window.confirm("Are you sure you want to delete this chat?")) {
            return;
        }
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${threadId}`, {
                method: "DELETE"
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const res = await response.json();
            console.log("Delete response:", res);

            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error(err);
            setError("Failed to delete chat");
        }
    };

    return (
        <div className="sidebar">
            <button className="new-chat-btn" onClick={createNewChat}>
                <span className="plus-icon">+</span>
                New Chat
            </button>

            <div className="history-section">
                <h3>Chat History</h3>
                {loading && <div className="sidebar-loading">Loading chats...</div>}
                {error && <div className="sidebar-error">{error}</div>}

                <div className="history-list">
                    {allThreads && allThreads.length > 0 ? (
                        <ul>
                            {allThreads.map((thread) => (
                                <li
                                    key={thread.threadId}
                                    onClick={() => changeThread(thread.threadId)}
                                    className={thread.threadId === currThreadId ? "highlighted" : ""}
                                >
                                    <span className="thread-icon">💬</span>
                                    <span className="thread-title">{thread.title}</span>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteThread(thread.threadId);
                                        }}
                                        title="Delete chat"
                                    >
                                        🗑️
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loading && <div className="no-chats">No chat history yet</div>
                    )}
                </div>
            </div>

            <div className="footer">
                <p>By Manpreet ❤️</p>
            </div>
        </div>
    );
}

export default Sidebar;