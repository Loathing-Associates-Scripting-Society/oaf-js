import { VariableManager } from "./variables";
import get from "axios";
import { urlencoded } from "express";
import { DiscordAPIError, MessageEmbed } from "discord.js";

type FoundName = {
    name: string,
    url: string,
}

export class ItemFinder {
    private _nameMap: Map<string, FoundName> = new Map();
    private _searchApiKey: string;
    private _customSearch: string;

    constructor(variableManager: VariableManager) {
        this._searchApiKey = variableManager.get("GOOGLE_API_KEY") || "";
        this._customSearch = variableManager.get("CUSTOM_SEARCH") || "";
    }

    async itemfinderEmbed(item: string): Promise<MessageEmbed | undefined> {
        const foundName = await this.findName(item);
        if (!foundName) return undefined;
        return new MessageEmbed()
            .setTitle(foundName.name)
            .setURL(foundName.url)
            .setFooter(
                "Problems? Message Phillammon#2824 on discord.",
                "http://images.kingdomofloathing.com/itemimages/oaf.gif" 
            )
    }

    async findName(searchTerm: string): Promise<FoundName | undefined> {
        if (!searchTerm.length) return undefined;
        const searchTermCrushed = searchTerm.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
        if (this._nameMap.has(searchTermCrushed)) return this._nameMap.get(searchTermCrushed);
        const wikiName = searchTerm.replace(/\s/g, "_");
        const wikiSearchName = searchTerm.replace(/\s/g, "+");
        console.log("Trying precise wiki page");
        try {
            const directWikiResponse = await get(`https://kol.coldfront.net/thekolwiki/index.php/${wikiName}`);
            const directResponseUrl = String(directWikiResponse.request.res.responseUrl);
            if (directResponseUrl.indexOf("index.php?search=") < 0) {
                const name = ItemFinder.nameFromWikiUrl(directResponseUrl)
                this._nameMap.set(searchTermCrushed, {name: name, url: directResponseUrl})
                return this._nameMap.get(searchTermCrushed);
            }
        }
        catch (error) {console.log(error.toString())}
        console.log("Not found as wiki page");
        console.log("Trying wiki search");
        try {
            const wikiSearchResponse = await get(`https://kol.coldfront.net/thekolwiki/index.php?search=${wikiSearchName}`);
            const searchResponseUrl = String(wikiSearchResponse.request.res.responseUrl);
            if (searchResponseUrl.indexOf("index.php?search=") < 0) {
                const name = ItemFinder.nameFromWikiUrl(searchResponseUrl)
                this._nameMap.set(searchTermCrushed, {name: name, url: searchResponseUrl})
                return this._nameMap.get(searchTermCrushed);
            }
        }
        catch (error) {console.log(error.toString())}
        console.log("Not found in wiki search");
        console.log("Trying google search");
        try {
            const googleSearchResponse = await get(`https://www.googleapis.com/customsearch/v1`, {
                params: {
                    key: this._searchApiKey,
                    cx: this._customSearch,
                    q: searchTerm,
                }
            });
            const name = ItemFinder.nameFromWikiUrl(googleSearchResponse.data.items[0].link)
            this._nameMap.set(searchTermCrushed, {name: name, url: googleSearchResponse.data.items[0].link})
            return this._nameMap.get(searchTermCrushed);
        }
        catch (error) {console.log(error.toString())}
        console.log("Google search stumped, I give up");
        return undefined;
    }

    static nameFromWikiUrl(url: string): string {
        return decodeURI(url.split("/index.php/")[1]).replace(/\_/g, " ");
    }
}