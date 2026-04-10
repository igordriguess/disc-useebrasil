const UseeIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="38" cy="35" r="5" fill="currentColor" />
    <circle cx="65" cy="28" r="4" fill="currentColor" />
    <path
      d="M30 55 C40 78, 70 78, 80 45"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default UseeIcon;
