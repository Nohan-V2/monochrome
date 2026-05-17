import { onRequest as __album_t__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\album\\t\\[id].js"
import { onRequest as __artist_t__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\artist\\t\\[id].js"
import { onRequest as __playlist_t__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\playlist\\t\\[id].js"
import { onRequest as __track_t__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\track\\t\\[id].js"
import { onRequest as __unreleased__sheetId___projectName__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\unreleased\\[sheetId]\\[projectName].js"
import { onRequest as __album__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\album\\[id].js"
import { onRequest as __artist__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\artist\\[id].js"
import { onRequest as __playlist__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\playlist\\[id].js"
import { onRequest as __podcasts__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\podcasts\\[id].js"
import { onRequest as __track__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\track\\[id].js"
import { onRequest as __unreleased__sheetId__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\unreleased\\[sheetId].js"
import { onRequest as __user___username__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\user\\@[username].js"
import { onRequest as __userplaylist__id__js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\userplaylist\\[id].js"
import { onRequest as __about_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\about\\index.js"
import { onRequest as __donate_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\donate\\index.js"
import { onRequest as __library_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\library\\index.js"
import { onRequest as __parties_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\parties\\index.js"
import { onRequest as __recent_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\recent\\index.js"
import { onRequest as __settings_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\settings\\index.js"
import { onRequest as __unreleased_index_js_onRequest } from "C:\\Users\\nolan\\Documents\\Workspace\\Github\\monochrome\\functions\\unreleased\\index.js"

export const routes = [
    {
      routePath: "/album/t/:id",
      mountPath: "/album/t",
      method: "",
      middlewares: [],
      modules: [__album_t__id__js_onRequest],
    },
  {
      routePath: "/artist/t/:id",
      mountPath: "/artist/t",
      method: "",
      middlewares: [],
      modules: [__artist_t__id__js_onRequest],
    },
  {
      routePath: "/playlist/t/:id",
      mountPath: "/playlist/t",
      method: "",
      middlewares: [],
      modules: [__playlist_t__id__js_onRequest],
    },
  {
      routePath: "/track/t/:id",
      mountPath: "/track/t",
      method: "",
      middlewares: [],
      modules: [__track_t__id__js_onRequest],
    },
  {
      routePath: "/unreleased/:sheetId/:projectName",
      mountPath: "/unreleased/:sheetId",
      method: "",
      middlewares: [],
      modules: [__unreleased__sheetId___projectName__js_onRequest],
    },
  {
      routePath: "/album/:id",
      mountPath: "/album",
      method: "",
      middlewares: [],
      modules: [__album__id__js_onRequest],
    },
  {
      routePath: "/artist/:id",
      mountPath: "/artist",
      method: "",
      middlewares: [],
      modules: [__artist__id__js_onRequest],
    },
  {
      routePath: "/playlist/:id",
      mountPath: "/playlist",
      method: "",
      middlewares: [],
      modules: [__playlist__id__js_onRequest],
    },
  {
      routePath: "/podcasts/:id",
      mountPath: "/podcasts",
      method: "",
      middlewares: [],
      modules: [__podcasts__id__js_onRequest],
    },
  {
      routePath: "/track/:id",
      mountPath: "/track",
      method: "",
      middlewares: [],
      modules: [__track__id__js_onRequest],
    },
  {
      routePath: "/unreleased/:sheetId",
      mountPath: "/unreleased",
      method: "",
      middlewares: [],
      modules: [__unreleased__sheetId__js_onRequest],
    },
  {
      routePath: "/user/@:username",
      mountPath: "/user",
      method: "",
      middlewares: [],
      modules: [__user___username__js_onRequest],
    },
  {
      routePath: "/userplaylist/:id",
      mountPath: "/userplaylist",
      method: "",
      middlewares: [],
      modules: [__userplaylist__id__js_onRequest],
    },
  {
      routePath: "/about",
      mountPath: "/about",
      method: "",
      middlewares: [],
      modules: [__about_index_js_onRequest],
    },
  {
      routePath: "/donate",
      mountPath: "/donate",
      method: "",
      middlewares: [],
      modules: [__donate_index_js_onRequest],
    },
  {
      routePath: "/library",
      mountPath: "/library",
      method: "",
      middlewares: [],
      modules: [__library_index_js_onRequest],
    },
  {
      routePath: "/parties",
      mountPath: "/parties",
      method: "",
      middlewares: [],
      modules: [__parties_index_js_onRequest],
    },
  {
      routePath: "/recent",
      mountPath: "/recent",
      method: "",
      middlewares: [],
      modules: [__recent_index_js_onRequest],
    },
  {
      routePath: "/settings",
      mountPath: "/settings",
      method: "",
      middlewares: [],
      modules: [__settings_index_js_onRequest],
    },
  {
      routePath: "/unreleased",
      mountPath: "/unreleased",
      method: "",
      middlewares: [],
      modules: [__unreleased_index_js_onRequest],
    },
  ]