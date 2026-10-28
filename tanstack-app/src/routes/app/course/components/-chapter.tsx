import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'

type ChapterProps = {
    courseID: string
    index: number
    chapter: { id: string; title: string; modules: Array<{ id: string; title: string }> }
    moduleIndexStart: number
    firstOpen: boolean
}

function stripNumberPrefix(title: string) {
    return title.replace(/^(chapter|module)\s*\d+\s*:\s*/i, '')
}

function Chapter({ courseID, index, chapter, moduleIndexStart, firstOpen }: ChapterProps) {
    const [isOpen, setIsOpen] = useState(firstOpen)

    function toggle() {
        setIsOpen((prev) => !prev)
    }

    return (
        <div className='bg-bg2 border border-black dark:border-white/50 hover:border-amber-400 transition-colors'>
            <button onClick={toggle} className='w-full flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-left' aria-expanded={isOpen}>
                <div className='h-11 sm:h-12 aspect-square shrink-0 rotate-45 border border-black dark:border-white/50 bg-bg1 flex items-center justify-center'>
                    <span className='-rotate-45 font-irish-grover text-lg sm:text-xl text-[#3A10E5] dark:text-white'>
                        {String(index + 1).padStart(2, '0')}
                    </span>
                </div>
                <div className='flex-1 min-w-0'>
                    <h4 className='font-medium text-lg sm:text-xl truncate'>{stripNumberPrefix(chapter.title)}</h4>
                    <p className='text-xs uppercase tracking-widest opacity-40 mt-0.5'>
                        {chapter.modules.length} module{chapter.modules.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className='overflow-hidden'>
                    <div className='mx-4 sm:mx-5 border-t border-black/20 dark:border-white/15'>
                        {chapter.modules.map((module, mi) => (
                            <Link
                                key={module.id}
                                to="/app/course/$courseID/$moduleID"
                                params={{ courseID: courseID, moduleID: module.id }}
                                className='group flex items-center gap-3 sm:gap-4 py-3.5 not-last:border-b not-last:border-black/10 dark:not-last:border-white/10'
                            >
                                <span className='w-8 shrink-0 text-sm tabular-nums opacity-40'>
                                    {String(moduleIndexStart + mi + 1).padStart(2, '0')}
                                </span>
                                <span className='flex-1 min-w-0 truncate text-base sm:text-lg'>
                                    {stripNumberPrefix(module.title)}
                                </span>
                                <ArrowRight className='h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-75' />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chapter
