import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, FileText } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50', '#E91E63', '#9C27B0', '#FF5722', '#607D8B'];

const AccountingReports = () => {
  const [reportType, setReportType] = useState('basSummary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [basData, setBasData] = useState({
    accounts: [],
    categories: [],
    totalHours: 0
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('chart');

  // Simulated fetch function - in a real app, this would call your backend API
  const fetchBasData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Sample data - in a real app this would come from the backend
      const data = {
        accounts: [
          { account_id: '1930', account_name: 'Företagskonto', category: 'Tillgångar', total_hours: 12.5, task_count: 3 },
          { account_id: '5010', account_name: 'Lokalhyra', category: 'Kostnader', total_hours: 8.2, task_count: 2 },
          { account_id: '5800', account_name: 'Resekostnader', category: 'Kostnader', total_hours: 5.5, task_count: 4 },
          { account_id: '6200', account_name: 'Telekommunikation', category: 'Kostnader', total_hours: 3.8, task_count: 1 },
          { account_id: '7010', account_name: 'Löner', category: 'Personal', total_hours: 45.2, task_count: 8 }
        ],
        categories: [
          { category: 'Tillgångar', total_hours: 12.5 },
          { category: 'Kostnader', total_hours: 17.5 },
          { category: 'Personal', total_hours: 45.2 }
        ],
        total_hours: 75.2
      };
      
      setBasData(data);
      setLoading(false);
    }, 800);
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchBasData();
  }, [dateRange, reportType]);

  // Format data for charts
  const getChartData = () => {
    if (reportType === 'basSummary') {
      return basData.accounts.map(account => ({
        name: account.account_id,
        hours: account.total_hours,
        fullName: `${account.account_id} - ${account.account_name}`,
        category: account.category
      }));
    } else if (reportType === 'categoryBreakdown') {
      return basData.categories.map(cat => ({
        name: cat.category,
        value: cat.total_hours
      }));
    }
    return [];
  };

  // Create an exportable CSV of the data
  const exportToCSV = () => {
    // Convert data to CSV format
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    if (reportType === 'basSummary') {
      csvContent += "Account ID,Account Name,Category,Total Hours,Task Count\n";
      
      // Add data rows
      basData.accounts.forEach(account => {
        csvContent += `${account.account_id},${account.account_name},${account.category},${account.total_hours},${account.task_count}\n`;
      });
    } else if (reportType === 'categoryBreakdown') {
      csvContent += "Category,Total Hours\n";
      
      // Add data rows
      basData.categories.forEach(category => {
        csvContent += `${category.category},${category.total_hours}\n`;
      });
    }
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Accounting Reports</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('chart')}
            className={`p-2 rounded ${viewMode === 'chart' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
          >
            <span className="h-5 w-5">📊</span>
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
          >
            <FileText className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="basSummary">BAS Account Summary</option>
            <option value="categoryBreakdown">Category Breakdown</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded p-2"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded p-2"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Total Hours</h3>
          <p className="text-2xl font-bold text-blue-900">{basData.total_hours.toFixed(1)}h</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-700 mb-1">BAS Accounts</h3>
          <p className="text-2xl font-bold text-green-900">{basData.accounts.length}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-700 mb-1">Categories</h3>
          <p className="text-2xl font-bold text-purple-900">{basData.categories.length}</p>
        </div>
      </div>
      
      {/* Chart or table view */}
      <div className="mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : viewMode === 'chart' ? (
          <div className="h-80">
            {reportType === 'basSummary' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value, name, props) => [`${value.toFixed(1)}h`, props.payload.fullName]} />
                  <Legend />
                  <Bar dataKey="hours" name="Hours Spent">
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {reportType === 'basSummary' ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportType === 'basSummary' ? (
                  basData.accounts.map((account, index) => (
                    <tr key={account.account_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.account_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.account_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.total_hours.toFixed(1)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.task_count}</td>
                    </tr>
                  ))
                ) : (
                  basData.categories.map((category, index) => (
                    <tr key={category.category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.total_hours.toFixed(1)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {((category.total_hours / basData.total_hours) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Export buttons */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" /> Export to CSV
        </button>
      </div>
    </div>
  );
};

export default AccountingReports;