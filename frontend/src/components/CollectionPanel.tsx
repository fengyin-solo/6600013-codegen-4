import { useState } from 'react'
import { useDesignStore } from '../store/design'

export default function CollectionPanel() {
  const store = useDesignStore()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const startRename = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const confirmRename = () => {
    if (editingId && editName.trim()) {
      store.renameWork(editingId, editName)
    }
    setEditingId(null)
    setEditName('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-20 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-gray-600 transition-all"
      >
        <span className="text-lg">📚</span>
        <span className="text-sm font-medium">我的收藏</span>
        {store.savedWorks.length > 0 && (
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
            {store.savedWorks.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-700 z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📚</span>
            <span>我的收藏</span>
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
              {store.savedWorks.length}
            </span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-3">
          {store.savedWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <span className="text-5xl mb-3">🖼️</span>
              <p className="text-sm">还没有收藏的作品</p>
              <p className="text-xs mt-1">设计满意后点击「收藏」按钮保存</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {store.savedWorks.map((work) => (
                <div
                  key={work.id}
                  className="group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all"
                >
                  <div
                    className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-gray-950"
                    onClick={() => {
                      store.loadWork(work.id)
                      setIsOpen(false)
                    }}
                  >
                    <img
                      src={work.thumbnail}
                      alt={work.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-medium bg-indigo-600 px-3 py-1 rounded-full">
                        载入编辑
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    {editingId === work.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={confirmRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename()
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditName('')
                          }
                        }}
                        className="w-full text-xs bg-gray-700 border border-indigo-500 rounded px-1 py-0.5 text-white outline-none"
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-xs font-medium truncate cursor-pointer hover:text-indigo-400"
                        onDoubleClick={() => startRename(work.id, work.name)}
                        title="双击重命名"
                      >
                        {work.name}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {formatDate(work.createdAt)}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => store.loadWork(work.id)}
                        className="flex-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 py-1 rounded transition-colors"
                        title="载入参数"
                      >
                        载入
                      </button>
                      <button
                        onClick={() => store.exportSavedWork(work.id, 'svg')}
                        className="flex-1 text-[10px] bg-teal-600 hover:bg-teal-500 py-1 rounded transition-colors"
                        title="导出 SVG"
                      >
                        SVG
                      </button>
                      <button
                        onClick={() => store.exportSavedWork(work.id, 'png')}
                        className="flex-1 text-[10px] bg-rose-600 hover:bg-rose-500 py-1 rounded transition-colors"
                        title="导出 PNG"
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除「${work.name}」吗？`)) {
                            store.deleteWork(work.id)
                          }
                        }}
                        className="text-[10px] bg-gray-700 hover:bg-red-600 w-6 py-1 rounded transition-colors"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
