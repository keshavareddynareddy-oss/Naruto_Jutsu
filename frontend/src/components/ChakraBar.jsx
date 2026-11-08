export default function ChakraBar({ chakra = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(chakra)));

  return (
    <div className="chakra-wrap">
      <div className="chakra-label-row">
        <span>Chakra Sync</span>
        <span>{safeValue}%</span>
      </div>
      <div className="chakra-track">
        <div className="chakra-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
