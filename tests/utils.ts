
export function removeTestElements() {
    Array.from(document.body.childNodes).forEach(node => {
        node.parentNode.removeChild(node);
    });
}
