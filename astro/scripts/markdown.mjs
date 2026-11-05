// Preserve Hugo's explicit heading anchors without displaying the attribute syntax.
export function headingAttributes() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === "heading") {
        const last = node.children.at(-1);
        const match = last?.value?.match(/\s*\{#([^}]+)\}\s*$/);
        if (match) {
          last.value = last.value.slice(0, match.index);
          node.data = {
            ...node.data,
            hProperties: { ...node.data?.hProperties, id: match[1] },
          };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
