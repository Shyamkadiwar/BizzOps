import React, { useState, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, TrendingUp, TrendingDown, AlertTriangle, Package, BarChart3, Camera, Upload, CheckCircle, XCircle, Info } from 'lucide-react';
import VoiceInput from '../VoiceInput/VoiceInput.jsx';

// Response Formatter Components
const JSONResponseFormatter = ({ data }) => (
  <div className="space-y-2">
    <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
      <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  </div>
);

const ImageProcessingResponseFormatter = ({ content, imageResult }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <Camera size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-gray-700">Image Processing Result</span>
    </div>
    
    {imageResult?.success ? (
      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="font-medium text-green-800">Success</span>
        </div>
        {imageResult.summary && (
          <div className="text-sm text-green-700 mb-2">
            Added {imageResult.summary.successful} of {imageResult.summary.total} items
          </div>
        )}
      </div>
    ) : (
      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <XCircle size={16} className="text-red-600" />
          <span className="font-medium text-red-800">Failed</span>
        </div>
      </div>
    )}
    
    <div className="prose prose-sm max-w-none">
      <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
    </div>
    
    {imageResult?.parsedItems && imageResult.parsedItems.length > 0 && (
      <div className="mt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Items:</h4>
        <div className="space-y-1">
          {imageResult.parsedItems.map((item, index) => (
            <div key={index} className="bg-blue-50 p-2 rounded text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.item}</span>
                <span className="text-blue-600">Qty: {item.quantity}</span>
              </div>
              <div className="text-gray-600 text-xs">{item.category}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const AnalysisResponseFormatter = ({ content }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <BarChart3 size={16} className="text-purple-600" />
      <span className="text-sm font-medium text-gray-700">Analysis Report</span>
    </div>
    <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
      <div className="prose prose-sm max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  </div>
);

const StockResponseFormatter = ({ content }) => {
  const lines = content.split('\n').filter(line => line.trim());
  const hasStockInfo = content.toLowerCase().includes('stock') || content.toLowerCase().includes('inventory');
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Package size={16} className="text-green-600" />
        <span className="text-sm font-medium text-gray-700">Stock Information</span>
      </div>
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        {hasStockInfo ? (
          <div className="space-y-2">
            {lines.map((line, index) => {
              if (line.includes('📦') || line.includes('✅') || line.includes('❌')) {
                return (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span>{line}</span>
                  </div>
                );
              }
              return (
                <div key={index} className="text-sm text-gray-700">
                  {line}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap text-sm">{content}</div>
        )}
      </div>
    </div>
  );
};

const ReportResponseFormatter = ({ content }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <BarChart3 size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-gray-700">Report</span>
    </div>
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="prose prose-sm max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  </div>
);

const DefaultResponseFormatter = ({ content }) => (
  <div className="prose prose-sm max-w-none">
    <div className="text-gray-700 whitespace-pre-wrap">{content}</div>
  </div>
);

const InventoryAgentChat = ({ authToken }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [useVoiceInput, setUseVoiceInput] = useState(false);
  const fileInputRef = useRef(null);

  // Function to extract the actual response content from the agent
  const extractResponseContent = (result) => {
    if (result.success && result.data && result.data.response) {
      return result.data.response;
    }
    return result.response || result.message || 'Operation completed successfully';
  };

  // Function to detect response type and format accordingly
  const formatResponse = (content, hasImageProcessing = false, imageResult = null) => {
    if (!content) {
      return <DefaultResponseFormatter content="No response content available" />;
    }

    // Special formatting for image processing results
    if (hasImageProcessing && imageResult) {
      return <ImageProcessingResponseFormatter content={content} imageResult={imageResult} />;
    }

    try {
      const jsonResponse = JSON.parse(content);
      return <JSONResponseFormatter data={jsonResponse} />;
    } catch {
      const contentLower = content.toLowerCase();
      
      if (contentLower.includes('inventory analysis') || contentLower.includes('analyze')) {
        return <AnalysisResponseFormatter content={content} />;
      } else if (contentLower.includes('stock') || contentLower.includes('items')) {
        return <StockResponseFormatter content={content} />;
      } else if (contentLower.includes('report') || contentLower.includes('summary')) {
        return <ReportResponseFormatter content={content} />;
      } else {
        return <DefaultResponseFormatter content={content} />;
      }
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    const userMessage = inputMessage.trim() || "Process this image and add items to inventory";
    setInputMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      hasImage: !!selectedImage,
      imagePreview: imagePreview
    }]);

    setIsLoading(true);

    try {
      const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('query', userMessage);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Choose endpoint based on whether image is included
      const endpoint = selectedImage 
        ? `${BACKEND_URL}/api/v1/inventory/inventory-agent-with-image`
        : `${BACKEND_URL}/api/v1/inventory/inventory-agent`;

      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      };

      // Set body based on content type
      if (selectedImage) {
        requestOptions.body = formData;
      } else {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify({ query: userMessage });
      }

      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Agent Response:', result);

      const responseContent = extractResponseContent(result);

      // Add agent response to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'agent',
        content: responseContent,
        timestamp: new Date(),
        success: result.success,
        hasImageProcessing: result.data?.hasImage || false,
        imageProcessingResult: result.data?.imageProcessingResult || null,
        rawResponse: result
      }]);

      // Clear image after sending
      clearImage();

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: `❌ Error: ${error.message}. Please check your connection and try again.`,
        timestamp: new Date(),
        success: false
      }]);
      clearImage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    clearImage();
  };

  const quickActions = [
    "Show me all inventory items",
    "Analyze my inventory",
    "Give me stock recommendations", 
    "Generate inventory report",
    "Check for low stock items"
  ];

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-40"
        title="Inventory Assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[700px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-[#36363a] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <h3 className="font-semibold">AI Inventory Assistant</h3>
                <span className="text-xs bg-white text-black px-2 py-1 rounded-full">Image Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-blue-200 hover:text-white text-sm px-3 py-1 hover:bg-blue-800 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-blue-200 hover:text-white p-1 hover:bg-blue-800 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#28282B]">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="mb-4 text-lg font-medium font-poppins text-white">Hello! I'm your AI inventory assistant.</p>
                  <p className="text-sm mb-6 font-poppins text-white">Upload images or ask me about your inventory:</p>
                  
                  {/* Image Upload Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Camera size={20} />
                      Upload Image to Add Items
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(action)}
                        className="text-left text-sm text-white bg-[#353538] px-4 py-3 rounded-lg transition-all hover:shadow-sm"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-lg p-4'
                        : message.type === 'error'
                        ? 'bg-red-50 border border-red-200 rounded-lg p-4'
                        : 'bg-white border border-gray-200 rounded-lg p-4'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {message.type === 'user' ? (
                        <User size={16} className="text-blue-200" />
                      ) : message.type === 'error' ? (
                        <AlertTriangle size={16} className="text-red-600" />
                      ) : (
                        <Bot size={16} className="text-green-600" />
                      )}
                      <span className="text-xs font-medium opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Image Preview for User Messages */}
                    {message.type === 'user' && message.hasImage && message.imagePreview && (
                      <div className="mb-3">
                        <img 
                          src={message.imagePreview} 
                          alt="Uploaded" 
                          className="max-w-48 max-h-32 rounded border object-cover"
                        />
                      </div>
                    )}

                    {/* Message Content */}
                    {message.type === 'agent' ? (
                      formatResponse(
                        message.content, 
                        message.hasImageProcessing, 
                        message.imageProcessingResult
                      )
                    ) : (
                      <div className={`${message.type === 'error' ? 'text-red-700' : ''}`}>
                        {message.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <Bot size={16} className="text-green-600" />
                      <span className="text-xs font-medium opacity-70">Processing...</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">
                        {selectedImage ? 'Analyzing image and processing...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-white p-4">
              {/* Voice Input Toggle */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="voiceInputToggle"
                  checked={useVoiceInput}
                  onChange={(e) => setUseVoiceInput(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="voiceInputToggle" className="text-sm text-gray-700">
                  🎤 Enable Voice Input
                </label>
              </div>

              {/* Voice Input Component */}
              {useVoiceInput && (
                <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    🎙️ Voice Input - Ask about inventory in any language
                  </div>
                  <VoiceInput 
                    onTranscript={(voiceQuery) => {
                      setInputMessage(voiceQuery);
                      // Auto-send the message after voice input
                      setTimeout(() => {
                        if (voiceQuery.trim()) {
                          sendMessage();
                        }
                      }, 500);
                    }}
                    onError={(error) => {
                      console.error('Voice input error:', error);
                    }}
                    placeholder="Ask about your inventory using voice..."
                    className="mb-2"
                  />
                  <div className="text-xs text-green-600 flex flex-wrap gap-1">
                    <span>💡 Try:</span>
                    <span className="bg-white px-1 py-0.5 rounded text-xs">मेरे inventory में क्या है?</span>
                    <span className="bg-white px-1 py-0.5 rounded text-xs">What&apos;s my stock level?</span>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <img 
                    src={imagePreview} 
                    alt="Selected" 
                    className="w-12 h-12 rounded object-cover border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Image selected</p>
                    <p className="text-xs text-gray-500">Ready to process</p>
                  </div>
                  <button
                    onClick={clearImage}
                    className="text-gray-500 hover:text-red-500 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {/* Image Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Upload Image"
                >
                  <Camera size={20} />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedImage ? "Describe what to do with this image..." : "Ask about your inventory or upload an image..."}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryAgentChat;