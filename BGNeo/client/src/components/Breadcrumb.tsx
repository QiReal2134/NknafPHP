export default function Breadcrumb({ items }: { items: { label: string; path?: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="面包屑导航">
      <ol>
        <li><a href="/">首页</a></li>
        {items.map((item, i) => (
          <li key={i}>{item.path ? <a href={item.path}>{item.label}</a> : <span>{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
