(() => {
  const { CMS, createClass, h } = window;
  const listWidget = CMS.getWidget("list");

  function thumbnail(src) {
    if (!src) return undefined;
    try {
      const url = new URL(src, new URL("/", location.href));
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {
      return undefined;
    }
  }

  const PhotoOrder = createClass({
    getInitialState() {
      return { status: "", target: null };
    },

    move(from, to) {
      const { value, onChange } = this.props;
      if (!value || !Number.isInteger(from) || from < 0 || from >= value.size ||
          to < 0 || to >= value.size || from === to) return;
      onChange(value.delete(from).insert(to, value.get(from)));
      this.setState({ status: `Foto ${from + 1} movida para a posição ${to + 1}.` });
    },

    render() {
      const { value, field, classNameWrapper } = this.props;
      const photos = value ? value.toArray() : [];
      const nativeProps = { ...this.props, field: field.set("widget", "list") };

      return h("div", { className: classNameWrapper },
        h("div", { className: "photo-order" },
          h("p", null, "Arraste as miniaturas ou use as setas para mudar a ordem da galeria."),
          h("ol", { className: "photo-order-grid", "aria-label": "Ordem das fotos" },
            photos.map((photo, index) => {
              const src = thumbnail(photo.get("src"));
              const caption = photo.get("caption");
              return h("li", {
                key: index,
                className: this.state.target === index ? "is-target" : "",
                onDragOver: (event) => {
                  if (this.dragged == null) return;
                  event.preventDefault();
                  this.setState({ target: index });
                },
                onDrop: (event) => {
                  if (this.dragged == null) return;
                  event.preventDefault();
                  this.move(this.dragged, index);
                  this.dragged = null;
                  this.setState({ target: null });
                },
              },
              h("div", {
                className: "photo-order-thumb",
                draggable: true,
                onDragStart: (event) => {
                  this.dragged = index;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index + 1));
                },
                onDragEnd: () => {
                  this.dragged = null;
                  this.setState({ target: null });
                },
              }, src ? h("img", { src, alt: caption || `Foto ${index + 1}`, loading: "lazy", draggable: false }) : "Sem foto"),
              h("div", { className: "photo-order-controls" },
                h("span", null, index + 1),
                h("button", { type: "button", disabled: index === 0, "aria-label": `Adiantar foto ${index + 1}`, onClick: () => this.move(index, index - 1) }, "←"),
                h("button", { type: "button", disabled: index === photos.length - 1, "aria-label": `Atrasar foto ${index + 1}`, onClick: () => this.move(index, index + 1) }, "→")));
            })),
          h("p", { className: "photo-order-status", role: "status" }, this.state.status),
          h("details", null,
            h("summary", null, "Adicionar fotos, editar legendas e destaques"),
            h(listWidget.control, nativeProps))));
    },
  });

  CMS.registerWidget("photo-order", PhotoOrder, listWidget.preview, listWidget.schema);
  CMS.init();
})();
