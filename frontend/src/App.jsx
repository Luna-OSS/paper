import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardDocumentIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

function App() {
  const [papers, setPapers] = useState([]);
  const [newPaper, setNewPaper] = useState('');

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
    const data = await response.json();
    setNewPaper('');
    fetchPapers();
  }

  async function copyPaper(id) {
    const response = await fetch(`/api/papers/${id}`);
    const data = await response.json();
    navigator.clipboard.writeText(data.content);
  }

  function openPaper(id) {
    window.open(`/paper/${id}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-macos-gray p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-ubuntu-aubergine">Pastebin Clone</h1>
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
            <div key={paper.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-gray-800 truncate">{paper.content}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(paper.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyPaper(paper.id)}
                  className="p-2 text-macos-blue hover:bg-macos-blue hover:bg-opacity-10 rounded transition-colors"
                  title="Copy"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
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
    </div>
  );
}

export default App;
