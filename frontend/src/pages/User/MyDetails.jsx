import React from 'react';

const MyDetail = () => {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">My Details</h2>
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-gray-600">Detail 1</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-gray-600">Detail 2</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-gray-600">Detail 3</span>
        </div>
      </div>
    </div>
  );
};

export default MyDetail;