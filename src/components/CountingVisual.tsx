/**
 * 通用计数可视化：用任意 emoji 把数学题画出来。支持几种模式：
 *  - groups + perGroup：乘法，画 groups 组、每组 perGroup 个
 *  - parts：加法，画几堆（如 [5,3]），中间带 +
 *  - total (+ leaving)：减法/计数，画 total 个，最后 leaving 个"飞走/消失"
 */
export interface VisualSpec {
  item: string; // emoji，如 "🐦" "🍎"
  total?: number;
  leaving?: number; // 末尾这么多个做"飞走"效果（减法）
  parts?: number[]; // 分几堆（加法）
  groups?: number; // 乘法：几组
  perGroup?: number; // 乘法：每组几个
}

function Item({
  item,
  delayMs,
  leaving,
}: {
  item: string;
  delayMs: number;
  leaving?: boolean;
}) {
  return (
    <span
      className={`cv-item ${leaving ? "is-leaving" : ""}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {item}
    </span>
  );
}

export default function CountingVisual({ spec }: { spec: VisualSpec }) {
  const { item, total, leaving = 0, parts, groups, perGroup } = spec;

  // 乘法：组
  if (groups && perGroup) {
    return (
      <div className="cv-groups">
        {Array.from({ length: groups }).map((_, g) => (
          <div className="cv-group" key={g}>
            {Array.from({ length: perGroup }).map((_, i) => (
              <Item key={i} item={item} delayMs={(g * perGroup + i) * 55} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // 加法：几堆
  if (parts && parts.length) {
    let idx = 0;
    return (
      <div className="cv-parts">
        {parts.map((n, pi) => (
          <div className="cv-part-wrap" key={pi}>
            {pi > 0 && <span className="cv-plus">+</span>}
            <div className="cv-group">
              {Array.from({ length: n }).map((_, i) => (
                <Item key={i} item={item} delayMs={idx++ * 55} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 计数 / 减法：total 个，末尾 leaving 个飞走
  const count = total ?? 0;
  const keep = count - leaving;
  return (
    <div className="cv-group cv-single">
      {Array.from({ length: count }).map((_, i) => (
        <Item
          key={i}
          item={item}
          delayMs={i * 55}
          leaving={i >= keep}
        />
      ))}
    </div>
  );
}
