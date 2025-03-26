import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Plus, Check, Trash2, Edit, Save } from 'lucide-react';

const App = () => {
  // State management
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    estimated_hours: 1, 
    start_date: new Date().toISOString().split('T')[0],
    bas_account: '1930' // Default BAS account
  });
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [editingTask, setEditingTask] = useState(null);
  const [basAccounts, setBasAccounts] = useState([
    { id: '1930', name: 'Företagskonto / checkräkningskonto' },
    { id: '5010', name: 'Lokalhyra' },
    { id: '5800', name: 'Resekostnader' },
    { id: '6200', name: 'Telekommunikation' },
    { id: '7010', name: 'Löner' }
  ]);

  // Demo data for initial display
  useEffect(() => {
    const demoTasks = [
      { id: 1, title: 'Website Development', description: 'Frontend implementation', estimated_hours: 20, start_date: '2025-03-20', status: 'in_progress', bas_account: '7010', actual_hours: 8.5 },
      { id: 2, title: 'API Integration', description: 'Connect to payment gateway', estimated_hours: 8, start_date: '2025-03-22', status: 'not_started', bas_account: '6200', actual_hours: 0 },
      { id: 3, title: 'Client Meeting', description: 'Review project progress', estimated_hours: 2, start_date: '2025-03-24', status: 'completed', bas_account: '5800', actual_hours: 1.5 }
    ];
    
    const demoTimeEntries = [
      { id: 1, task_id: 1, start_time: '2025-03-20T09:00:00', end_time: '2025-03-20T12:30:00', duration: 3.5, notes: 'Header and navigation' },
      { id: 2, task_id: 1, start_time: '2025-03-21T14:00:00', end_time: '2025-03-21T19:00:00', duration: 5, notes: 'Responsive design' },
      { id: 3, task_id: 3, start_time: '2025-03-24T10:00:00', end_time: '2025-03-24T11:30:00', duration: 1.5, notes: 'Progress review' }
    ];
    
    setTasks(demoTasks);
    setTimeEntries(demoTimeEntries);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevElapsed => prevElapsed + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start timer for a task
  const startTimer = (task) => {
    if (timerRunning) return;
    setActiveTask(task);
    setStartTime(new Date());
    setTimerRunning(true);
    setElapsedTime(0);
  };

  // Stop timer and record time entry
  const stopTimer = () => {
    if (!timerRunning) return;
    setTimerRunning(false);
    
    const endTime = new Date();
    const duration = elapsedTime / 3600; // convert seconds to hours
    
    const newTimeEntry = {
      id: timeEntries.length + 1,
      task_id: activeTask.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration: parseFloat(duration.toFixed(2)),
      notes: `Work session`
    };
    
    // Update time entries
    setTimeEntries([...timeEntries, newTimeEntry]);
    
    // Update task's actual hours
    setTasks(tasks.map(task => 
      task.id === activeTask.id 
        ? { ...task, actual_hours: (task.actual_hours || 0) + duration } 
        : task
    ));
    
    setActiveTask(null);
  };

  // Add new task
  const addTask = () => {
    const task = {
      id: tasks.length + 1,
      ...newTask,
      status: 'not_started',
      actual_hours: 0
    };
    setTasks([...tasks, task]);
    setNewTask({ 
      title: '', 
      description: '', 
      estimated_hours: 1, 
      start_date: new Date().toISOString().split('T')[0],
      bas_account: '1930'
    });
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setTimeEntries(timeEntries.filter(entry => entry.task_id !== taskId));
  };

  // Start editing a task
  const startEditing = (task) => {
    setEditingTask({ ...task });
  };

  // Save edited task
  const saveTask = () => {
    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ));
    setEditingTask(null);
  };

  // Mark task as complete
  const completeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed' } 
        : task
    ));
  };

  // Calculate metrics for charts
  const tasksByStatus = [
    { name: 'Not Started', value: tasks.filter(t => t.status === 'not_started').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length }
  ];

  const timeByAccount = basAccounts.map(account => ({
    name: account.id,
    description: account.name,
    hours: tasks
      .filter(task => task.bas_account === account.id)
      .reduce((sum, task) => sum + (task.actual_hours || 0), 0)
  })).filter(item => item.hours > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Calculate completion percentage
  const calculateCompletion = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  // Calculate time accuracy
  const calculateTimeAccuracy = () => {
    const tasksWithBothTimes = tasks.filter(t => t.estimated_hours > 0 && t.actual_hours > 0);
    if (tasksWithBothTimes.length === 0) return 100;
    
    const accuracySum = tasksWithBothTimes.reduce((sum, task) => {
      const accuracy = 100 - Math.min(100, Math.abs((task.actual_hours / task.estimated_hours * 100) - 100));
      return sum + accuracy;
    }, 0);
    
    return Math.round(accuracySum / tasksWithBothTimes.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Management & Time Tracking</h1>
          <p className="text-gray-600">Track tasks, time, and integrate with Swedish BAS accounting system</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Task Completion Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Task Completion</h2>
            <div className="flex items-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{calculateCompletion()}%</span>
                </div>
                <svg className="h-16 w-16" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E6E6E6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeDasharray={`${calculateCompletion()}, 100`}
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed Tasks</p>
                <p className="text-lg font-semibold">{tasks.filter(t => t.status === 'completed').length} of {tasks.length}</p>
              </div>
            </div>
          </div>

          {/* Time Accuracy Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Time Estimation Accuracy</h2>
            <div className="flex items-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{calculateTimeAccuracy()}%</span>
                </div>
                <svg className="h-16 w-16" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E6E6E6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${calculateTimeAccuracy()}, 100`}
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Estimated vs. Actual Time</p>
                <p className="text-lg font-semibold">
                  {tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0).toFixed(1)}h est. / 
                  {tasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0).toFixed(1)}h act.
                </p>
              </div>
            </div>
          </div>

          {/* Active Timer Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Time Tracker</h2>
            {activeTask ? (
              <div>
                <p className="text-sm text-gray-500">Currently tracking:</p>
                <p className="font-semibold">{activeTask.title}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-xl font-mono">{formatTime(elapsedTime)}</span>
                  <button 
                    onClick={stopTimer}
                    className="ml-auto bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No active task. Start a timer from the task list below.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Task Status Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Task Status</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Time by BAS Account Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Time by BAS Account</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={timeByAccount}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name, props) => [`${value.toFixed(1)}h`, props.payload.description]} />
                <Legend />
                <Bar dataKey="hours" fill="#4F46E5" name="Hours Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add Task Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Task description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newTask.estimated_hours}
                onChange={(e) => setNewTask({...newTask, estimated_hours: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newTask.start_date}
                onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BAS Account</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={newTask.bas_account}
                onChange={(e) => setNewTask({...newTask, bas_account: e.target.value})}
              >
                {basAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.id} - {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
                onClick={addTask}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">Task List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BAS Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id}>
                    {editingTask && editingTask.id === task.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                          />
                          <input
                            type="text"
                            className="border border-gray-300 rounded px-2 py-1 w-full mt-1"
                            value={editingTask.description}
                            onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="border border-gray-300 rounded px-2 py-1"
                            value={editingTask.status}
                            onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            className="border border-gray-300 rounded px-2 py-1 w-24"
                            value={editingTask.estimated_hours}
                            onChange={(e) => setEditingTask({...editingTask, estimated_hours: parseFloat(e.target.value)})}
                          />
                          <span className="mx-2">est /</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            className="border border-gray-300 rounded px-2 py-1 w-24"
                            value={editingTask.actual_hours}
                            onChange={(e) => setEditingTask({...editingTask, actual_hours: parseFloat(e.target.value)})}
                          />
                          <span className="ml-1">act</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            className="border border-gray-300 rounded px-2 py-1"
                            value={editingTask.bas_account}
                            onChange={(e) => setEditingTask({...editingTask, bas_account: e.target.value})}
                          >
                            {basAccounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.id} - {account.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={saveTask}
                            className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingTask(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status === 'completed' ? 'Completed' : 
                             task.status === 'in_progress' ? 'In Progress' : 
                             'Not Started'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.estimated_hours}h est / {task.actual_hours.toFixed(1)}h act
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.actual_hours > 0 ? 
                              `${Math.round((task.actual_hours / task.estimated_hours) * 100)}% of estimate` : 
                              'No time tracked'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{task.bas_account}</div>
                          <div className="text-xs text-gray-500">
                            {basAccounts.find(a => a.id === task.bas_account)?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          {!timerRunning && task.status !== 'completed' && (
                            <button 
                              onClick={() => startTimer(task)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                              title="Start Timer"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          {task.status !== 'completed' && (
                            <button 
                              onClick={() => completeTask(task.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                              title="Mark Complete"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => startEditing(task)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;