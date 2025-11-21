import { createFileRoute, Link } from "@tanstack/react-router";
import { orpc } from "@/utils/orpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery(
    orpc.search.search.queryOptions({
      input: { query: searchQuery },
      staleTime: 1000 * 60 * 5,
    })
  );

  const searchResults = data?.hits ?? [];

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2 text-balance">
            Topside <span className="text-orange-500">DB</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Complete Arc Raiders resource database and search engine
          </p>
        </div>

        {/* Search Command */}
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Search for anything Arc Raiders..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="h-[300px] overflow-y-auto">
            <CommandEmpty className="h-full flex items-center justify-center">
              No results found.
            </CommandEmpty>
            {searchResults.length > 0 && (
              <CommandGroup heading="Search Results">
                {searchResults.map((result) => (
                  <Link
                    to="/item/$itemId"
                    params={{ itemId: result.id }}
                    key={result.id}
                    preload="intent"
                  >
                    <CommandItem value={result.name ?? undefined}>
                      <img
                        src={result.imageFilename}
                        alt={result.name}
                        className="w-10 h-10 rounded-full"
                      />
                      {result.name}{" "}
                      <span className="text-muted-foreground">-</span>
                      <span className="text-sm text-muted-foreground">
                        {result.type}
                      </span>
                    </CommandItem>
                  </Link>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </main>
  );
}
