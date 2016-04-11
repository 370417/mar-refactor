export default _ => ({
    add(actor, delta = 0) {
        let prev = this;
        let next = this.next;
        while (next && next.delta <= delta) {
            delta -= next.delta;
            prev = next;
            next = next.next;
        }
        if (next) {
            next.delta -= delta;
        }
        prev.next = {actor, delta, next};
        return this;
    },
    advance() {
        if (!this.next) {
            return undefined;
        }
        const actor = this.next.actor;
        this.next = this.next.next;
        return actor;
    },
});
