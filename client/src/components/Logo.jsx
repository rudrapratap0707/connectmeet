export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl md:text-5xl',
  };
  return (
    <span className={`font-extrabold tracking-tight ${sizes[size]}`}>
      <span className="text-pearl">Connect</span>
      <span className="text-coral">Meet</span>
    </span>
  );
}
