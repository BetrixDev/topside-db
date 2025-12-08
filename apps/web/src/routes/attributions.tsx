import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { ExternalLinkIcon, BookOpenIcon, GithubIcon, HeartIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/attributions")({
  component: AttributionsPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Attributions | Topside DB",
        description:
          "Credits and attributions for the data sources used by Topside DB, including the Arc Raiders Wiki and arcraiders-data repository.",
        keywords: "arc raiders, attributions, credits, wiki, data sources",
      }),
    ],
  }),
});

const dataSources = [
  {
    name: "Arc Raiders Wiki",
    description:
      "The community-maintained Arc Raiders Wiki provides detailed information about arcs, maps, traders, and other game content. We scrape and process this data to provide comprehensive information in Topside DB.",
    url: "https://arcraiders.wiki",
    icon: BookOpenIcon,
    contributions: [
      "Arc enemy information and statistics",
      "Map details and difficulty ratings",
      "Trader inventories and locations",
      "Game mechanics and strategies",
    ],
  },
  {
    name: "arcraiders-data",
    description:
      "The RaidTheory arcraiders-data repository is an open-source collection of structured game data extracted from Arc Raiders. This repository serves as the primary source for items, quests, and hideout station information.",
    url: "https://github.com/RaidTheory/arcraiders-data",
    icon: GithubIcon,
    contributions: [
      "Item database with stats, recipes, and recycling info",
      "Quest objectives and reward details",
      "Hideout station upgrade requirements",
      "Localized game strings and translations",
    ],
  },
];

function AttributionsPage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-6">
            <HeartIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Attributions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Topside DB is made possible by the hard work of the Arc Raiders
            community. We gratefully acknowledge the following data sources that
            power this database.
          </p>
        </div>

        {/* Data Sources */}
        <div className="space-y-6 mb-12">
          {dataSources.map((source) => (
            <Card
              key={source.name}
              className="border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shrink-0">
                    <source.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-1">{source.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {source.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Data contributions:
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {source.contributions.map((contribution, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {contribution}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Visit {source.name}
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Credits */}
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Credits</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Embark Studios</strong> —
              Creators and developers of Arc Raiders. All game content, assets,
              and trademarks are the property of Embark Studios.
            </p>
            <p>
              <strong className="text-foreground">Community Contributors</strong>{" "}
              — Special thanks to everyone who contributes to the Arc Raiders
              Wiki and the arcraiders-data repository. Your efforts make
              community tools like Topside DB possible.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Topside DB is a fan-made project and is not affiliated with or
            endorsed by Embark Studios. If you are a content creator whose work
            appears on this site and would like it removed or attributed
            differently, please{" "}
            <a
              href="https://github.com/RaidTheory/arcraiders-data/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
