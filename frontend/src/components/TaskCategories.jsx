import { TaskCard } from './TaskCard'

export function TaskCategories({ stats }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">10 Ta Asosiy Yo'nalish</h2>
        <p className="text-slate-600">Yoshlar yetakchilarining KPI ko'rsatkichlarini baholash</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {stats.map(task => (
          <TaskCard key={task.direction} task={task} />
        ))}
      </div>
    </div>
  )
}
