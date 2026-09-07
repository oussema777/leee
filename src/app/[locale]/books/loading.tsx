import { Container } from "@/components/ui/Container";

export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-surface-primary" aria-busy="true" aria-label="Loading books">
      <section className="bg-accent-navy">
        <Container className="py-16 lg:py-20">
          <div className="h-14 max-w-2xl animate-pulse rounded-md bg-white/10 motion-reduce:animate-none" />
          <div className="mt-6 h-5 max-w-xl animate-pulse rounded-md bg-white/10 motion-reduce:animate-none" />
          <div className="mt-10 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-sm bg-white/10 motion-reduce:animate-none" />
            ))}
          </div>
        </Container>
      </section>
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="h-[430px] animate-pulse rounded-2xl bg-white sm:col-span-2 motion-reduce:animate-none" />
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
          ))}
        </div>
      </Container>
    </div>
  );
}
