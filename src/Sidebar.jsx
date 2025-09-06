import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

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
                    
                    if (chat.message && chat.message.trim().length > 0) {
                        // Use the actual message with proper truncation
                        title = chat.message.trim().slice(0, 30);
                        if (chat.message.length > 30) title += "...";
                    } else if (chat.response && chat.response.trim().length > 0) {
                        // If message is empty but response exists, use response
                        title = "AI: " + chat.response.trim().slice(0, 27);
                        if (chat.response.length > 27) title += "...";
                    }
                    
                    threadsMap[chat.threadId] = {
                        threadId: chat.threadId,
                        title: title,
                        timestamp: chat.timestamp || new Date().toISOString()
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
        setCurrThreadId(uuidv1());
        setPrevChats([]);
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
        <section className="sidebar">
            <button className="new-chat-btn" onClick={createNewChat}>
                <img src="src/assets/veridalogo.png" alt="gpt logo" className="logo" />
                <span>+ New Chat</span>
            </button>

            {loading && <div className="sidebar-loading">Loading chats...</div>}
            {error && <div className="sidebar-error">{error}</div>}

            <div className="history">
                <h3>Chat History</h3>
                {allThreads && allThreads.length > 0 ? (
                    <ul>
                        {allThreads.map((thread) => (
                            <li
                                key={thread.threadId}
                                onClick={() => changeThread(thread.threadId)}
                                className={thread.threadId === currThreadId ? "highlighted" : ""}
                            >
                                <span className="thread-title">{thread.title}</span>
                                <i
                                    className="fa-solid fa-trash delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteThread(thread.threadId);
                                    }}
                                    title="Delete chat"
                                ></i>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !loading && <div className="no-chats">No chat history yet</div>
                )}
            </div>

            <div className="sign">
                <p>By Manpreet &hearts;</p>
            </div>
        </section>
    );
}

export default Sidebar;