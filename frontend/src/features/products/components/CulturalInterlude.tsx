import { motion } from "framer-motion";

interface Interlude {
  kicker: string;
  title: string;
  body: string;
}

interface Props {
  interlude: Interlude;
  variant: 0 | 1;
}

/** Animated editorial interlude between product blocks. Two distinct designs. */
const CulturalInterlude: React.FC<Props> = ({ interlude, variant }) => {
  const words = interlude.title.split(" ");

  // ── Variant 0: light, centered, word-by-word reveal ──────────────────────
  if (variant === 0) {
    return (
      <section className="relative overflow-hidden bg-white py-28 md:py-40">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.4em] text-plum-600"
          >
            {interlude.kicker}
          </motion.span>

          <h2 className="display mt-7 flex flex-wrap justify-center gap-x-4 text-4xl font-semibold leading-[1.05] text-ink md:text-6xl">
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={i >= words.length - 1 ? "italic text-plum-600" : ""}
              >
                {w}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink/55"
          >
            {interlude.body}
          </motion.p>
        </div>
      </section>
    );
  }

  // ── Variant 1: dark band, oversized side word + parallax rule ─────────────
  return (
    <section className="grain relative overflow-hidden bg-ink py-28 text-white md:py-40">
      <div className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 select-none">
        <motion.span
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 0.06, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="display text-[28vw] font-semibold leading-none"
        >
          ጥለት
        </motion.span>
      </div>

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-12 md:px-10">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden h-40 w-px origin-top bg-plum-400 md:col-span-1 md:block"
        />
        <div className="md:col-span-11">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.4em] text-plum-400"
          >
            {interlude.kicker}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="display mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] md:text-6xl"
          >
            {interlude.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/60"
          >
            {interlude.body}
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default CulturalInterlude;
