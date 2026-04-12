export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-[20px] p-5 shadow-[0_1px_3px_rgba(26,21,35,0.06),0_4px_16px_rgba(26,21,35,0.04)] ${className}`}>
      {children}
    </div>
  )
}
