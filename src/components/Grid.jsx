export function Grid({ items, onOpen }) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
      {items.map((it, i) => (
        <button key={it.src} onClick={() => onOpen(i)} className="group block w-full overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
          <img src={it.src} alt={it.alt} loading="lazy" className="w-full transition duration-500 group-hover:scale-105" />
        </button>
      ))}
    </div>
  );
}
