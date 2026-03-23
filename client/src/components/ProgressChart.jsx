import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ProgressChart = ({ data, title = "Interview Progress", height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No interview data yet</p>
            <p className="text-sm">Complete some interviews to see your progress!</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Prepare chart data
  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      })
    }),
    datasets: [
      {
        label: 'Overall Score',
        data: sortedData.map(item => item.overallScore),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Technical Score',
        data: sortedData.map(item => item.technicalScore || item.overallScore),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex
            const item = sortedData[dataIndex]
            return `${item.company} - ${new Date(item.date).toLocaleDateString()}`
          },
          label: function(context) {
            const dataIndex = context.dataIndex
            const item = sortedData[dataIndex]
            if (context.dataset.label === 'Overall Score') {
              return `Overall: ${context.parsed.y.toFixed(1)}/10 (${item.questionsAnswered} questions)`
            } else {
              return `Technical: ${context.parsed.y.toFixed(1)}/10`
            }
          },
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex
            const item = sortedData[dataIndex]
            return [
              `Role: ${item.role}`,
              `Experience: ${item.experience}`,
              `Duration: ${item.duration || 'N/A'}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Interview Date',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Score (out of 10)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        min: 0,
        max: 10,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value + '/10'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      point: {
        hoverBackgroundColor: 'white'
      }
    }
  }

  // Calculate stats
  const latestScore = sortedData[sortedData.length - 1]?.overallScore || 0
  const firstScore = sortedData[0]?.overallScore || 0
  const improvement = latestScore - firstScore
  const averageScore = sortedData.reduce((sum, item) => sum + item.overallScore, 0) / sortedData.length

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{latestScore.toFixed(1)}</div>
            <div className="text-gray-500">Latest</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
            </div>
            <div className="text-gray-500">Change</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{averageScore.toFixed(1)}</div>
            <div className="text-gray-500">Average</div>
          </div>
        </div>
      </div>
      
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* Progress insights */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Progress Insights</h4>
        <div className="text-sm text-gray-600 space-y-1">
          {improvement > 0.5 && (
            <p className="text-green-600">🎉 Great improvement! You've increased your score by {improvement.toFixed(1)} points.</p>
          )}
          {improvement < -0.5 && (
            <p className="text-orange-600">📈 Keep practicing! Focus on areas where you can improve.</p>
          )}
          {Math.abs(improvement) <= 0.5 && sortedData.length > 1 && (
            <p className="text-blue-600">📊 Consistent performance! You're maintaining steady scores.</p>
          )}
          <p>You've completed {sortedData.length} interview{sortedData.length !== 1 ? 's' : ''} with an average score of {averageScore.toFixed(1)}/10.</p>
        </div>
      </div>
    </div>
  )
}

export default ProgressChart