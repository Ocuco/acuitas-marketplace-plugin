/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Runs one full production build. `npm run dev:hot` starts this under `node --watch-path=src`, so
// every change to src/ rebuilds from scratch. `vite build --watch` cannot be used: its incremental
// rebuilds fail in the federation plugin ("Unable to get file name for unknown file") after
// emptying dist/, so the remote serves nothing until the shell is restarted.
import { build } from 'vite';

await build();
