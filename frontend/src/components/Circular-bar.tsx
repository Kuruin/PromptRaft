import { FC } from 'react'

interface Props {
    strokeWidth?: number
    sqSize?: number
    percentage: number
}

const CircularProgressBar: FC<Props> = (props) => {
    const { strokeWidth = 8, sqSize = 160, percentage } = props
    const radius = (sqSize - strokeWidth) / 2
    const viewBox = `0 0 ${sqSize} ${sqSize}`
    const dashArray = radius * Math.PI * 2
    const dashOffset = dashArray - (dashArray * (percentage || 0)) / 100
    const statusMessage = `${percentage}%`

    return (
        <svg width={sqSize} height={sqSize} viewBox={viewBox}>
            <circle
                className={`fill-none stroke-green-700/50 transition-all delay-400 duration-400 ease-in ${percentage < 10 ? "stroke-red-600/50" : ""}`}
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
            />
            <circle
                className={`fill-none stroke-green-500 transition-all delay-400 duration-400 ease-in ${percentage < 10 ? "stroke-red-500" : ""}`}
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeLinecap="round"
                strokeWidth={`${strokeWidth}px`}
                transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                style={{
                    strokeDasharray: dashArray,
                    strokeDashoffset: dashOffset,
                }}
            />
            <text
                x="50%"
                y="50%"
                dy=".3em"
                textAnchor="middle"
                color="red"
                fill="white"
                className="text-[40px] font-semibold transition-all delay-300 duration-500 ease-in font-mono"
            >
                {statusMessage}
            </text>
        </svg>
    )
}

export default CircularProgressBar