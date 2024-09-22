import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardDocumentIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

function App() {
  const [papers, setPapers] = useState([]);
  const [newPaper, setNewPaper] = useState('');
  const [popupContent, setPopupContent] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchPapers();
    const interval = setInterval(fetchPapers, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPapers() {
    const response = await fetch('/api/papers');
    const data = await response.json();
    setPapers(data);
  }

  async function addPaper() {
    const response = await fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPaper }),
    });
    await response.json();
    setNewPaper('');
    fetchPapers();
  }

  const copyPaper = async (paper) => {
    try {
      await navigator.clipboard.writeText(paper.content);
      setPapers(papers.map(p => p.id === paper.id ? {...p, copied: true} : p));
    } catch {
      setPopupContent(paper.content);
    }
  };

  const closePopup = () => {
    setPopupContent('');
  };

  useEffect(() => {
    if (popupContent && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [popupContent]);

  function openPaper(id) {
    window.open(`/paper/${id}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-macos-gray p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-ubuntu-aubergine">Paper - Copy & Paste</h1>
        <div className="mb-8">
          <textarea
            className="w-full p-2 border border-gray-300 rounded"
            rows="4"
            value={newPaper}
            onChange={(e) => setNewPaper(e.target.value)}
            placeholder="Enter your text here..."
          />
          <button
            className="mt-2 px-4 py-2 bg-ubuntu-orange text-white rounded hover:bg-opacity-90 transition-colors"
            onClick={addPaper}
          >
            Add Paper
          </button>
        </div>
        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white p-4 rounded shadow flex items-center">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-gray-800 truncate">{paper.content}</p>
                <p className="text-sm text-gray-500 truncate">
                  {formatDistanceToNow(new Date(paper.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex space-x-2 min-w-fit">
                <button
                  onClick={() => copyPaper(paper)}
                  className="p-2 text-macos-blue hover:bg-macos-blue hover:bg-opacity-10 rounded transition-colors"
                  title="Copy"
                >
                {paper.copied ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
                </button>
                <button
                  onClick={() => openPaper(paper.id)}
                  className="p-2 text-macos-blue hover:bg-macos-blue hover:bg-opacity-10 rounded transition-colors"
                  title="Open"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {popupContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Copy Paper Content</h3>
              <button onClick={closePopup} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              id="copyTextarea"
              className="w-full h-40 p-2 border border-gray-300 rounded mb-4"
              value={popupContent}
              readOnly
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={closePopup}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
