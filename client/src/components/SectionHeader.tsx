// components/SectionHeader.tsx
const SectionHeader = ({ title }: { title: string }) => (
    <div className="w-full bg-[#fdf2e9] py-3 mb-6 text-center">
        <h2 className="text-[#c8922a] font-bold tracking-[0.2em] text-sm md:text-lg uppercase">
            {title}
        </h2>
    </div>
);