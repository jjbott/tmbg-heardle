var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function load (urls, test, callback) {
      let remaining = urls.length;

      function maybeCallback () {
        remaining = --remaining;
        if (remaining < 1) {
          callback();
        }
      }

      if (test()) {
        return callback()
      }

      for (const { type, url, content, options = { async: true, defer: true }} of urls) {
        const isScript = type === 'script';
        const tag = document.createElement(isScript ? 'script': 'link');
        const attribute = isScript ? 'src' : 'href';
        const hasUrl = Boolean(url).valueOf();

        if (isScript) {
          tag.async = options.async;
          tag.defer = options.defer;
        } else {
          tag.rel = 'stylesheet';
        }

        if (hasUrl) {
          tag[attribute] = url;
        } else {
          tag.appendChild(
            document.createTextNode(content)
          );
        }

        tag.onload = maybeCallback;
        document.body.appendChild(tag);
      }
    }

    const gaStore = writable([]);

    /* node_modules\@beyonk\svelte-google-analytics\src\GoogleAnalytics.svelte generated by Svelte v3.47.0 */

    function test() {
    	return Boolean(window.dataLayer).valueOf() && Array.isArray(window.dataLayer);
    }

    function gtag() {
    	window.dataLayer.push(arguments);
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { properties } = $$props;
    	let { configurations = {} } = $$props;
    	let { enabled = true } = $$props;

    	onMount(() => {
    		if (!enabled) {
    			return;
    		}

    		init();
    	});

    	function init() {
    		const mainProperty = properties[0];

    		load(
    			[
    				{
    					type: 'script',
    					url: `//www.googletagmanager.com/gtag/js?id=${mainProperty}`
    				}
    			],
    			test,
    			callback
    		);
    	}

    	function callback() {
    		window.dataLayer = window.dataLayer || [];
    		gtag('js', new Date());

    		properties.forEach(p => {
    			gtag('config', p, configurations[p] || {});
    		});

    		return gaStore.subscribe(queue => {
    			let next = queue.length && queue.shift();

    			while (next) {
    				const { type, event, data } = next;
    				gtag(type, event, data);
    				next = queue.shift();
    			}
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('properties' in $$props) $$invalidate(0, properties = $$props.properties);
    		if ('configurations' in $$props) $$invalidate(1, configurations = $$props.configurations);
    		if ('enabled' in $$props) $$invalidate(2, enabled = $$props.enabled);
    	};

    	return [properties, configurations, enabled, init];
    }

    class GoogleAnalytics extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$c, null, safe_not_equal, {
    			properties: 0,
    			configurations: 1,
    			enabled: 2,
    			init: 3
    		});
    	}

    	get init() {
    		return this.$$.ctx[3];
    	}
    }

    function addEvent (event, data) {
      if (!data.send_to) { delete data.send_to; }
      gaStore.update(exisiting => [ ...exisiting, { type: 'event', event, data } ]);
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire(path) {
    	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
    }

    var momentExports = {};
    var moment$1 = {
      get exports(){ return momentExports; },
      set exports(v){ momentExports = v; },
    };

    (function (module, exports) {
    (function (global, factory) {
    	    module.exports = factory() ;
    	}(commonjsGlobal, (function () {
    	    var hookCallback;

    	    function hooks() {
    	        return hookCallback.apply(null, arguments);
    	    }

    	    // This is done to register the method called with moment()
    	    // without creating circular dependencies.
    	    function setHookCallback(callback) {
    	        hookCallback = callback;
    	    }

    	    function isArray(input) {
    	        return (
    	            input instanceof Array ||
    	            Object.prototype.toString.call(input) === '[object Array]'
    	        );
    	    }

    	    function isObject(input) {
    	        // IE8 will treat undefined and null as object if it wasn't for
    	        // input != null
    	        return (
    	            input != null &&
    	            Object.prototype.toString.call(input) === '[object Object]'
    	        );
    	    }

    	    function hasOwnProp(a, b) {
    	        return Object.prototype.hasOwnProperty.call(a, b);
    	    }

    	    function isObjectEmpty(obj) {
    	        if (Object.getOwnPropertyNames) {
    	            return Object.getOwnPropertyNames(obj).length === 0;
    	        } else {
    	            var k;
    	            for (k in obj) {
    	                if (hasOwnProp(obj, k)) {
    	                    return false;
    	                }
    	            }
    	            return true;
    	        }
    	    }

    	    function isUndefined(input) {
    	        return input === void 0;
    	    }

    	    function isNumber(input) {
    	        return (
    	            typeof input === 'number' ||
    	            Object.prototype.toString.call(input) === '[object Number]'
    	        );
    	    }

    	    function isDate(input) {
    	        return (
    	            input instanceof Date ||
    	            Object.prototype.toString.call(input) === '[object Date]'
    	        );
    	    }

    	    function map(arr, fn) {
    	        var res = [],
    	            i,
    	            arrLen = arr.length;
    	        for (i = 0; i < arrLen; ++i) {
    	            res.push(fn(arr[i], i));
    	        }
    	        return res;
    	    }

    	    function extend(a, b) {
    	        for (var i in b) {
    	            if (hasOwnProp(b, i)) {
    	                a[i] = b[i];
    	            }
    	        }

    	        if (hasOwnProp(b, 'toString')) {
    	            a.toString = b.toString;
    	        }

    	        if (hasOwnProp(b, 'valueOf')) {
    	            a.valueOf = b.valueOf;
    	        }

    	        return a;
    	    }

    	    function createUTC(input, format, locale, strict) {
    	        return createLocalOrUTC(input, format, locale, strict, true).utc();
    	    }

    	    function defaultParsingFlags() {
    	        // We need to deep clone this object.
    	        return {
    	            empty: false,
    	            unusedTokens: [],
    	            unusedInput: [],
    	            overflow: -2,
    	            charsLeftOver: 0,
    	            nullInput: false,
    	            invalidEra: null,
    	            invalidMonth: null,
    	            invalidFormat: false,
    	            userInvalidated: false,
    	            iso: false,
    	            parsedDateParts: [],
    	            era: null,
    	            meridiem: null,
    	            rfc2822: false,
    	            weekdayMismatch: false,
    	        };
    	    }

    	    function getParsingFlags(m) {
    	        if (m._pf == null) {
    	            m._pf = defaultParsingFlags();
    	        }
    	        return m._pf;
    	    }

    	    var some;
    	    if (Array.prototype.some) {
    	        some = Array.prototype.some;
    	    } else {
    	        some = function (fun) {
    	            var t = Object(this),
    	                len = t.length >>> 0,
    	                i;

    	            for (i = 0; i < len; i++) {
    	                if (i in t && fun.call(this, t[i], i, t)) {
    	                    return true;
    	                }
    	            }

    	            return false;
    	        };
    	    }

    	    function isValid(m) {
    	        if (m._isValid == null) {
    	            var flags = getParsingFlags(m),
    	                parsedParts = some.call(flags.parsedDateParts, function (i) {
    	                    return i != null;
    	                }),
    	                isNowValid =
    	                    !isNaN(m._d.getTime()) &&
    	                    flags.overflow < 0 &&
    	                    !flags.empty &&
    	                    !flags.invalidEra &&
    	                    !flags.invalidMonth &&
    	                    !flags.invalidWeekday &&
    	                    !flags.weekdayMismatch &&
    	                    !flags.nullInput &&
    	                    !flags.invalidFormat &&
    	                    !flags.userInvalidated &&
    	                    (!flags.meridiem || (flags.meridiem && parsedParts));

    	            if (m._strict) {
    	                isNowValid =
    	                    isNowValid &&
    	                    flags.charsLeftOver === 0 &&
    	                    flags.unusedTokens.length === 0 &&
    	                    flags.bigHour === undefined;
    	            }

    	            if (Object.isFrozen == null || !Object.isFrozen(m)) {
    	                m._isValid = isNowValid;
    	            } else {
    	                return isNowValid;
    	            }
    	        }
    	        return m._isValid;
    	    }

    	    function createInvalid(flags) {
    	        var m = createUTC(NaN);
    	        if (flags != null) {
    	            extend(getParsingFlags(m), flags);
    	        } else {
    	            getParsingFlags(m).userInvalidated = true;
    	        }

    	        return m;
    	    }

    	    // Plugins that add properties should also add the key here (null value),
    	    // so we can properly clone ourselves.
    	    var momentProperties = (hooks.momentProperties = []),
    	        updateInProgress = false;

    	    function copyConfig(to, from) {
    	        var i,
    	            prop,
    	            val,
    	            momentPropertiesLen = momentProperties.length;

    	        if (!isUndefined(from._isAMomentObject)) {
    	            to._isAMomentObject = from._isAMomentObject;
    	        }
    	        if (!isUndefined(from._i)) {
    	            to._i = from._i;
    	        }
    	        if (!isUndefined(from._f)) {
    	            to._f = from._f;
    	        }
    	        if (!isUndefined(from._l)) {
    	            to._l = from._l;
    	        }
    	        if (!isUndefined(from._strict)) {
    	            to._strict = from._strict;
    	        }
    	        if (!isUndefined(from._tzm)) {
    	            to._tzm = from._tzm;
    	        }
    	        if (!isUndefined(from._isUTC)) {
    	            to._isUTC = from._isUTC;
    	        }
    	        if (!isUndefined(from._offset)) {
    	            to._offset = from._offset;
    	        }
    	        if (!isUndefined(from._pf)) {
    	            to._pf = getParsingFlags(from);
    	        }
    	        if (!isUndefined(from._locale)) {
    	            to._locale = from._locale;
    	        }

    	        if (momentPropertiesLen > 0) {
    	            for (i = 0; i < momentPropertiesLen; i++) {
    	                prop = momentProperties[i];
    	                val = from[prop];
    	                if (!isUndefined(val)) {
    	                    to[prop] = val;
    	                }
    	            }
    	        }

    	        return to;
    	    }

    	    // Moment prototype object
    	    function Moment(config) {
    	        copyConfig(this, config);
    	        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    	        if (!this.isValid()) {
    	            this._d = new Date(NaN);
    	        }
    	        // Prevent infinite loop in case updateOffset creates new moment
    	        // objects.
    	        if (updateInProgress === false) {
    	            updateInProgress = true;
    	            hooks.updateOffset(this);
    	            updateInProgress = false;
    	        }
    	    }

    	    function isMoment(obj) {
    	        return (
    	            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
    	        );
    	    }

    	    function warn(msg) {
    	        if (
    	            hooks.suppressDeprecationWarnings === false &&
    	            typeof console !== 'undefined' &&
    	            console.warn
    	        ) {
    	            console.warn('Deprecation warning: ' + msg);
    	        }
    	    }

    	    function deprecate(msg, fn) {
    	        var firstTime = true;

    	        return extend(function () {
    	            if (hooks.deprecationHandler != null) {
    	                hooks.deprecationHandler(null, msg);
    	            }
    	            if (firstTime) {
    	                var args = [],
    	                    arg,
    	                    i,
    	                    key,
    	                    argLen = arguments.length;
    	                for (i = 0; i < argLen; i++) {
    	                    arg = '';
    	                    if (typeof arguments[i] === 'object') {
    	                        arg += '\n[' + i + '] ';
    	                        for (key in arguments[0]) {
    	                            if (hasOwnProp(arguments[0], key)) {
    	                                arg += key + ': ' + arguments[0][key] + ', ';
    	                            }
    	                        }
    	                        arg = arg.slice(0, -2); // Remove trailing comma and space
    	                    } else {
    	                        arg = arguments[i];
    	                    }
    	                    args.push(arg);
    	                }
    	                warn(
    	                    msg +
    	                        '\nArguments: ' +
    	                        Array.prototype.slice.call(args).join('') +
    	                        '\n' +
    	                        new Error().stack
    	                );
    	                firstTime = false;
    	            }
    	            return fn.apply(this, arguments);
    	        }, fn);
    	    }

    	    var deprecations = {};

    	    function deprecateSimple(name, msg) {
    	        if (hooks.deprecationHandler != null) {
    	            hooks.deprecationHandler(name, msg);
    	        }
    	        if (!deprecations[name]) {
    	            warn(msg);
    	            deprecations[name] = true;
    	        }
    	    }

    	    hooks.suppressDeprecationWarnings = false;
    	    hooks.deprecationHandler = null;

    	    function isFunction(input) {
    	        return (
    	            (typeof Function !== 'undefined' && input instanceof Function) ||
    	            Object.prototype.toString.call(input) === '[object Function]'
    	        );
    	    }

    	    function set(config) {
    	        var prop, i;
    	        for (i in config) {
    	            if (hasOwnProp(config, i)) {
    	                prop = config[i];
    	                if (isFunction(prop)) {
    	                    this[i] = prop;
    	                } else {
    	                    this['_' + i] = prop;
    	                }
    	            }
    	        }
    	        this._config = config;
    	        // Lenient ordinal parsing accepts just a number in addition to
    	        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    	        // TODO: Remove "ordinalParse" fallback in next major release.
    	        this._dayOfMonthOrdinalParseLenient = new RegExp(
    	            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
    	                '|' +
    	                /\d{1,2}/.source
    	        );
    	    }

    	    function mergeConfigs(parentConfig, childConfig) {
    	        var res = extend({}, parentConfig),
    	            prop;
    	        for (prop in childConfig) {
    	            if (hasOwnProp(childConfig, prop)) {
    	                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
    	                    res[prop] = {};
    	                    extend(res[prop], parentConfig[prop]);
    	                    extend(res[prop], childConfig[prop]);
    	                } else if (childConfig[prop] != null) {
    	                    res[prop] = childConfig[prop];
    	                } else {
    	                    delete res[prop];
    	                }
    	            }
    	        }
    	        for (prop in parentConfig) {
    	            if (
    	                hasOwnProp(parentConfig, prop) &&
    	                !hasOwnProp(childConfig, prop) &&
    	                isObject(parentConfig[prop])
    	            ) {
    	                // make sure changes to properties don't modify parent config
    	                res[prop] = extend({}, res[prop]);
    	            }
    	        }
    	        return res;
    	    }

    	    function Locale(config) {
    	        if (config != null) {
    	            this.set(config);
    	        }
    	    }

    	    var keys;

    	    if (Object.keys) {
    	        keys = Object.keys;
    	    } else {
    	        keys = function (obj) {
    	            var i,
    	                res = [];
    	            for (i in obj) {
    	                if (hasOwnProp(obj, i)) {
    	                    res.push(i);
    	                }
    	            }
    	            return res;
    	        };
    	    }

    	    var defaultCalendar = {
    	        sameDay: '[Today at] LT',
    	        nextDay: '[Tomorrow at] LT',
    	        nextWeek: 'dddd [at] LT',
    	        lastDay: '[Yesterday at] LT',
    	        lastWeek: '[Last] dddd [at] LT',
    	        sameElse: 'L',
    	    };

    	    function calendar(key, mom, now) {
    	        var output = this._calendar[key] || this._calendar['sameElse'];
    	        return isFunction(output) ? output.call(mom, now) : output;
    	    }

    	    function zeroFill(number, targetLength, forceSign) {
    	        var absNumber = '' + Math.abs(number),
    	            zerosToFill = targetLength - absNumber.length,
    	            sign = number >= 0;
    	        return (
    	            (sign ? (forceSign ? '+' : '') : '-') +
    	            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
    	            absNumber
    	        );
    	    }

    	    var formattingTokens =
    	            /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
    	        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
    	        formatFunctions = {},
    	        formatTokenFunctions = {};

    	    // token:    'M'
    	    // padded:   ['MM', 2]
    	    // ordinal:  'Mo'
    	    // callback: function () { this.month() + 1 }
    	    function addFormatToken(token, padded, ordinal, callback) {
    	        var func = callback;
    	        if (typeof callback === 'string') {
    	            func = function () {
    	                return this[callback]();
    	            };
    	        }
    	        if (token) {
    	            formatTokenFunctions[token] = func;
    	        }
    	        if (padded) {
    	            formatTokenFunctions[padded[0]] = function () {
    	                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
    	            };
    	        }
    	        if (ordinal) {
    	            formatTokenFunctions[ordinal] = function () {
    	                return this.localeData().ordinal(
    	                    func.apply(this, arguments),
    	                    token
    	                );
    	            };
    	        }
    	    }

    	    function removeFormattingTokens(input) {
    	        if (input.match(/\[[\s\S]/)) {
    	            return input.replace(/^\[|\]$/g, '');
    	        }
    	        return input.replace(/\\/g, '');
    	    }

    	    function makeFormatFunction(format) {
    	        var array = format.match(formattingTokens),
    	            i,
    	            length;

    	        for (i = 0, length = array.length; i < length; i++) {
    	            if (formatTokenFunctions[array[i]]) {
    	                array[i] = formatTokenFunctions[array[i]];
    	            } else {
    	                array[i] = removeFormattingTokens(array[i]);
    	            }
    	        }

    	        return function (mom) {
    	            var output = '',
    	                i;
    	            for (i = 0; i < length; i++) {
    	                output += isFunction(array[i])
    	                    ? array[i].call(mom, format)
    	                    : array[i];
    	            }
    	            return output;
    	        };
    	    }

    	    // format date using native date object
    	    function formatMoment(m, format) {
    	        if (!m.isValid()) {
    	            return m.localeData().invalidDate();
    	        }

    	        format = expandFormat(format, m.localeData());
    	        formatFunctions[format] =
    	            formatFunctions[format] || makeFormatFunction(format);

    	        return formatFunctions[format](m);
    	    }

    	    function expandFormat(format, locale) {
    	        var i = 5;

    	        function replaceLongDateFormatTokens(input) {
    	            return locale.longDateFormat(input) || input;
    	        }

    	        localFormattingTokens.lastIndex = 0;
    	        while (i >= 0 && localFormattingTokens.test(format)) {
    	            format = format.replace(
    	                localFormattingTokens,
    	                replaceLongDateFormatTokens
    	            );
    	            localFormattingTokens.lastIndex = 0;
    	            i -= 1;
    	        }

    	        return format;
    	    }

    	    var defaultLongDateFormat = {
    	        LTS: 'h:mm:ss A',
    	        LT: 'h:mm A',
    	        L: 'MM/DD/YYYY',
    	        LL: 'MMMM D, YYYY',
    	        LLL: 'MMMM D, YYYY h:mm A',
    	        LLLL: 'dddd, MMMM D, YYYY h:mm A',
    	    };

    	    function longDateFormat(key) {
    	        var format = this._longDateFormat[key],
    	            formatUpper = this._longDateFormat[key.toUpperCase()];

    	        if (format || !formatUpper) {
    	            return format;
    	        }

    	        this._longDateFormat[key] = formatUpper
    	            .match(formattingTokens)
    	            .map(function (tok) {
    	                if (
    	                    tok === 'MMMM' ||
    	                    tok === 'MM' ||
    	                    tok === 'DD' ||
    	                    tok === 'dddd'
    	                ) {
    	                    return tok.slice(1);
    	                }
    	                return tok;
    	            })
    	            .join('');

    	        return this._longDateFormat[key];
    	    }

    	    var defaultInvalidDate = 'Invalid date';

    	    function invalidDate() {
    	        return this._invalidDate;
    	    }

    	    var defaultOrdinal = '%d',
    	        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    	    function ordinal(number) {
    	        return this._ordinal.replace('%d', number);
    	    }

    	    var defaultRelativeTime = {
    	        future: 'in %s',
    	        past: '%s ago',
    	        s: 'a few seconds',
    	        ss: '%d seconds',
    	        m: 'a minute',
    	        mm: '%d minutes',
    	        h: 'an hour',
    	        hh: '%d hours',
    	        d: 'a day',
    	        dd: '%d days',
    	        w: 'a week',
    	        ww: '%d weeks',
    	        M: 'a month',
    	        MM: '%d months',
    	        y: 'a year',
    	        yy: '%d years',
    	    };

    	    function relativeTime(number, withoutSuffix, string, isFuture) {
    	        var output = this._relativeTime[string];
    	        return isFunction(output)
    	            ? output(number, withoutSuffix, string, isFuture)
    	            : output.replace(/%d/i, number);
    	    }

    	    function pastFuture(diff, output) {
    	        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    	        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    	    }

    	    var aliases = {};

    	    function addUnitAlias(unit, shorthand) {
    	        var lowerCase = unit.toLowerCase();
    	        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    	    }

    	    function normalizeUnits(units) {
    	        return typeof units === 'string'
    	            ? aliases[units] || aliases[units.toLowerCase()]
    	            : undefined;
    	    }

    	    function normalizeObjectUnits(inputObject) {
    	        var normalizedInput = {},
    	            normalizedProp,
    	            prop;

    	        for (prop in inputObject) {
    	            if (hasOwnProp(inputObject, prop)) {
    	                normalizedProp = normalizeUnits(prop);
    	                if (normalizedProp) {
    	                    normalizedInput[normalizedProp] = inputObject[prop];
    	                }
    	            }
    	        }

    	        return normalizedInput;
    	    }

    	    var priorities = {};

    	    function addUnitPriority(unit, priority) {
    	        priorities[unit] = priority;
    	    }

    	    function getPrioritizedUnits(unitsObj) {
    	        var units = [],
    	            u;
    	        for (u in unitsObj) {
    	            if (hasOwnProp(unitsObj, u)) {
    	                units.push({ unit: u, priority: priorities[u] });
    	            }
    	        }
    	        units.sort(function (a, b) {
    	            return a.priority - b.priority;
    	        });
    	        return units;
    	    }

    	    function isLeapYear(year) {
    	        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    	    }

    	    function absFloor(number) {
    	        if (number < 0) {
    	            // -0 -> 0
    	            return Math.ceil(number) || 0;
    	        } else {
    	            return Math.floor(number);
    	        }
    	    }

    	    function toInt(argumentForCoercion) {
    	        var coercedNumber = +argumentForCoercion,
    	            value = 0;

    	        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
    	            value = absFloor(coercedNumber);
    	        }

    	        return value;
    	    }

    	    function makeGetSet(unit, keepTime) {
    	        return function (value) {
    	            if (value != null) {
    	                set$1(this, unit, value);
    	                hooks.updateOffset(this, keepTime);
    	                return this;
    	            } else {
    	                return get(this, unit);
    	            }
    	        };
    	    }

    	    function get(mom, unit) {
    	        return mom.isValid()
    	            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
    	            : NaN;
    	    }

    	    function set$1(mom, unit, value) {
    	        if (mom.isValid() && !isNaN(value)) {
    	            if (
    	                unit === 'FullYear' &&
    	                isLeapYear(mom.year()) &&
    	                mom.month() === 1 &&
    	                mom.date() === 29
    	            ) {
    	                value = toInt(value);
    	                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
    	                    value,
    	                    mom.month(),
    	                    daysInMonth(value, mom.month())
    	                );
    	            } else {
    	                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    	            }
    	        }
    	    }

    	    // MOMENTS

    	    function stringGet(units) {
    	        units = normalizeUnits(units);
    	        if (isFunction(this[units])) {
    	            return this[units]();
    	        }
    	        return this;
    	    }

    	    function stringSet(units, value) {
    	        if (typeof units === 'object') {
    	            units = normalizeObjectUnits(units);
    	            var prioritized = getPrioritizedUnits(units),
    	                i,
    	                prioritizedLen = prioritized.length;
    	            for (i = 0; i < prioritizedLen; i++) {
    	                this[prioritized[i].unit](units[prioritized[i].unit]);
    	            }
    	        } else {
    	            units = normalizeUnits(units);
    	            if (isFunction(this[units])) {
    	                return this[units](value);
    	            }
    	        }
    	        return this;
    	    }

    	    var match1 = /\d/, //       0 - 9
    	        match2 = /\d\d/, //      00 - 99
    	        match3 = /\d{3}/, //     000 - 999
    	        match4 = /\d{4}/, //    0000 - 9999
    	        match6 = /[+-]?\d{6}/, // -999999 - 999999
    	        match1to2 = /\d\d?/, //       0 - 99
    	        match3to4 = /\d\d\d\d?/, //     999 - 9999
    	        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
    	        match1to3 = /\d{1,3}/, //       0 - 999
    	        match1to4 = /\d{1,4}/, //       0 - 9999
    	        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
    	        matchUnsigned = /\d+/, //       0 - inf
    	        matchSigned = /[+-]?\d+/, //    -inf - inf
    	        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
    	        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
    	        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
    	        // any word (or two) characters or numbers including two/three word month in arabic.
    	        // includes scottish gaelic two word and hyphenated months
    	        matchWord =
    	            /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
    	        regexes;

    	    regexes = {};

    	    function addRegexToken(token, regex, strictRegex) {
    	        regexes[token] = isFunction(regex)
    	            ? regex
    	            : function (isStrict, localeData) {
    	                  return isStrict && strictRegex ? strictRegex : regex;
    	              };
    	    }

    	    function getParseRegexForToken(token, config) {
    	        if (!hasOwnProp(regexes, token)) {
    	            return new RegExp(unescapeFormat(token));
    	        }

    	        return regexes[token](config._strict, config._locale);
    	    }

    	    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    	    function unescapeFormat(s) {
    	        return regexEscape(
    	            s
    	                .replace('\\', '')
    	                .replace(
    	                    /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
    	                    function (matched, p1, p2, p3, p4) {
    	                        return p1 || p2 || p3 || p4;
    	                    }
    	                )
    	        );
    	    }

    	    function regexEscape(s) {
    	        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    	    }

    	    var tokens = {};

    	    function addParseToken(token, callback) {
    	        var i,
    	            func = callback,
    	            tokenLen;
    	        if (typeof token === 'string') {
    	            token = [token];
    	        }
    	        if (isNumber(callback)) {
    	            func = function (input, array) {
    	                array[callback] = toInt(input);
    	            };
    	        }
    	        tokenLen = token.length;
    	        for (i = 0; i < tokenLen; i++) {
    	            tokens[token[i]] = func;
    	        }
    	    }

    	    function addWeekParseToken(token, callback) {
    	        addParseToken(token, function (input, array, config, token) {
    	            config._w = config._w || {};
    	            callback(input, config._w, config, token);
    	        });
    	    }

    	    function addTimeToArrayFromToken(token, input, config) {
    	        if (input != null && hasOwnProp(tokens, token)) {
    	            tokens[token](input, config._a, config, token);
    	        }
    	    }

    	    var YEAR = 0,
    	        MONTH = 1,
    	        DATE = 2,
    	        HOUR = 3,
    	        MINUTE = 4,
    	        SECOND = 5,
    	        MILLISECOND = 6,
    	        WEEK = 7,
    	        WEEKDAY = 8;

    	    function mod(n, x) {
    	        return ((n % x) + x) % x;
    	    }

    	    var indexOf;

    	    if (Array.prototype.indexOf) {
    	        indexOf = Array.prototype.indexOf;
    	    } else {
    	        indexOf = function (o) {
    	            // I know
    	            var i;
    	            for (i = 0; i < this.length; ++i) {
    	                if (this[i] === o) {
    	                    return i;
    	                }
    	            }
    	            return -1;
    	        };
    	    }

    	    function daysInMonth(year, month) {
    	        if (isNaN(year) || isNaN(month)) {
    	            return NaN;
    	        }
    	        var modMonth = mod(month, 12);
    	        year += (month - modMonth) / 12;
    	        return modMonth === 1
    	            ? isLeapYear(year)
    	                ? 29
    	                : 28
    	            : 31 - ((modMonth % 7) % 2);
    	    }

    	    // FORMATTING

    	    addFormatToken('M', ['MM', 2], 'Mo', function () {
    	        return this.month() + 1;
    	    });

    	    addFormatToken('MMM', 0, 0, function (format) {
    	        return this.localeData().monthsShort(this, format);
    	    });

    	    addFormatToken('MMMM', 0, 0, function (format) {
    	        return this.localeData().months(this, format);
    	    });

    	    // ALIASES

    	    addUnitAlias('month', 'M');

    	    // PRIORITY

    	    addUnitPriority('month', 8);

    	    // PARSING

    	    addRegexToken('M', match1to2);
    	    addRegexToken('MM', match1to2, match2);
    	    addRegexToken('MMM', function (isStrict, locale) {
    	        return locale.monthsShortRegex(isStrict);
    	    });
    	    addRegexToken('MMMM', function (isStrict, locale) {
    	        return locale.monthsRegex(isStrict);
    	    });

    	    addParseToken(['M', 'MM'], function (input, array) {
    	        array[MONTH] = toInt(input) - 1;
    	    });

    	    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    	        var month = config._locale.monthsParse(input, token, config._strict);
    	        // if we didn't find a month name, mark the date as invalid.
    	        if (month != null) {
    	            array[MONTH] = month;
    	        } else {
    	            getParsingFlags(config).invalidMonth = input;
    	        }
    	    });

    	    // LOCALES

    	    var defaultLocaleMonths =
    	            'January_February_March_April_May_June_July_August_September_October_November_December'.split(
    	                '_'
    	            ),
    	        defaultLocaleMonthsShort =
    	            'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
    	        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
    	        defaultMonthsShortRegex = matchWord,
    	        defaultMonthsRegex = matchWord;

    	    function localeMonths(m, format) {
    	        if (!m) {
    	            return isArray(this._months)
    	                ? this._months
    	                : this._months['standalone'];
    	        }
    	        return isArray(this._months)
    	            ? this._months[m.month()]
    	            : this._months[
    	                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
    	                      ? 'format'
    	                      : 'standalone'
    	              ][m.month()];
    	    }

    	    function localeMonthsShort(m, format) {
    	        if (!m) {
    	            return isArray(this._monthsShort)
    	                ? this._monthsShort
    	                : this._monthsShort['standalone'];
    	        }
    	        return isArray(this._monthsShort)
    	            ? this._monthsShort[m.month()]
    	            : this._monthsShort[
    	                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
    	              ][m.month()];
    	    }

    	    function handleStrictParse(monthName, format, strict) {
    	        var i,
    	            ii,
    	            mom,
    	            llc = monthName.toLocaleLowerCase();
    	        if (!this._monthsParse) {
    	            // this is not used
    	            this._monthsParse = [];
    	            this._longMonthsParse = [];
    	            this._shortMonthsParse = [];
    	            for (i = 0; i < 12; ++i) {
    	                mom = createUTC([2000, i]);
    	                this._shortMonthsParse[i] = this.monthsShort(
    	                    mom,
    	                    ''
    	                ).toLocaleLowerCase();
    	                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
    	            }
    	        }

    	        if (strict) {
    	            if (format === 'MMM') {
    	                ii = indexOf.call(this._shortMonthsParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else {
    	                ii = indexOf.call(this._longMonthsParse, llc);
    	                return ii !== -1 ? ii : null;
    	            }
    	        } else {
    	            if (format === 'MMM') {
    	                ii = indexOf.call(this._shortMonthsParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._longMonthsParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else {
    	                ii = indexOf.call(this._longMonthsParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._shortMonthsParse, llc);
    	                return ii !== -1 ? ii : null;
    	            }
    	        }
    	    }

    	    function localeMonthsParse(monthName, format, strict) {
    	        var i, mom, regex;

    	        if (this._monthsParseExact) {
    	            return handleStrictParse.call(this, monthName, format, strict);
    	        }

    	        if (!this._monthsParse) {
    	            this._monthsParse = [];
    	            this._longMonthsParse = [];
    	            this._shortMonthsParse = [];
    	        }

    	        // TODO: add sorting
    	        // Sorting makes sure if one month (or abbr) is a prefix of another
    	        // see sorting in computeMonthsParse
    	        for (i = 0; i < 12; i++) {
    	            // make the regex if we don't have it already
    	            mom = createUTC([2000, i]);
    	            if (strict && !this._longMonthsParse[i]) {
    	                this._longMonthsParse[i] = new RegExp(
    	                    '^' + this.months(mom, '').replace('.', '') + '$',
    	                    'i'
    	                );
    	                this._shortMonthsParse[i] = new RegExp(
    	                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
    	                    'i'
    	                );
    	            }
    	            if (!strict && !this._monthsParse[i]) {
    	                regex =
    	                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
    	                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
    	            }
    	            // test the regex
    	            if (
    	                strict &&
    	                format === 'MMMM' &&
    	                this._longMonthsParse[i].test(monthName)
    	            ) {
    	                return i;
    	            } else if (
    	                strict &&
    	                format === 'MMM' &&
    	                this._shortMonthsParse[i].test(monthName)
    	            ) {
    	                return i;
    	            } else if (!strict && this._monthsParse[i].test(monthName)) {
    	                return i;
    	            }
    	        }
    	    }

    	    // MOMENTS

    	    function setMonth(mom, value) {
    	        var dayOfMonth;

    	        if (!mom.isValid()) {
    	            // No op
    	            return mom;
    	        }

    	        if (typeof value === 'string') {
    	            if (/^\d+$/.test(value)) {
    	                value = toInt(value);
    	            } else {
    	                value = mom.localeData().monthsParse(value);
    	                // TODO: Another silent failure?
    	                if (!isNumber(value)) {
    	                    return mom;
    	                }
    	            }
    	        }

    	        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    	        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    	        return mom;
    	    }

    	    function getSetMonth(value) {
    	        if (value != null) {
    	            setMonth(this, value);
    	            hooks.updateOffset(this, true);
    	            return this;
    	        } else {
    	            return get(this, 'Month');
    	        }
    	    }

    	    function getDaysInMonth() {
    	        return daysInMonth(this.year(), this.month());
    	    }

    	    function monthsShortRegex(isStrict) {
    	        if (this._monthsParseExact) {
    	            if (!hasOwnProp(this, '_monthsRegex')) {
    	                computeMonthsParse.call(this);
    	            }
    	            if (isStrict) {
    	                return this._monthsShortStrictRegex;
    	            } else {
    	                return this._monthsShortRegex;
    	            }
    	        } else {
    	            if (!hasOwnProp(this, '_monthsShortRegex')) {
    	                this._monthsShortRegex = defaultMonthsShortRegex;
    	            }
    	            return this._monthsShortStrictRegex && isStrict
    	                ? this._monthsShortStrictRegex
    	                : this._monthsShortRegex;
    	        }
    	    }

    	    function monthsRegex(isStrict) {
    	        if (this._monthsParseExact) {
    	            if (!hasOwnProp(this, '_monthsRegex')) {
    	                computeMonthsParse.call(this);
    	            }
    	            if (isStrict) {
    	                return this._monthsStrictRegex;
    	            } else {
    	                return this._monthsRegex;
    	            }
    	        } else {
    	            if (!hasOwnProp(this, '_monthsRegex')) {
    	                this._monthsRegex = defaultMonthsRegex;
    	            }
    	            return this._monthsStrictRegex && isStrict
    	                ? this._monthsStrictRegex
    	                : this._monthsRegex;
    	        }
    	    }

    	    function computeMonthsParse() {
    	        function cmpLenRev(a, b) {
    	            return b.length - a.length;
    	        }

    	        var shortPieces = [],
    	            longPieces = [],
    	            mixedPieces = [],
    	            i,
    	            mom;
    	        for (i = 0; i < 12; i++) {
    	            // make the regex if we don't have it already
    	            mom = createUTC([2000, i]);
    	            shortPieces.push(this.monthsShort(mom, ''));
    	            longPieces.push(this.months(mom, ''));
    	            mixedPieces.push(this.months(mom, ''));
    	            mixedPieces.push(this.monthsShort(mom, ''));
    	        }
    	        // Sorting makes sure if one month (or abbr) is a prefix of another it
    	        // will match the longer piece.
    	        shortPieces.sort(cmpLenRev);
    	        longPieces.sort(cmpLenRev);
    	        mixedPieces.sort(cmpLenRev);
    	        for (i = 0; i < 12; i++) {
    	            shortPieces[i] = regexEscape(shortPieces[i]);
    	            longPieces[i] = regexEscape(longPieces[i]);
    	        }
    	        for (i = 0; i < 24; i++) {
    	            mixedPieces[i] = regexEscape(mixedPieces[i]);
    	        }

    	        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    	        this._monthsShortRegex = this._monthsRegex;
    	        this._monthsStrictRegex = new RegExp(
    	            '^(' + longPieces.join('|') + ')',
    	            'i'
    	        );
    	        this._monthsShortStrictRegex = new RegExp(
    	            '^(' + shortPieces.join('|') + ')',
    	            'i'
    	        );
    	    }

    	    // FORMATTING

    	    addFormatToken('Y', 0, 0, function () {
    	        var y = this.year();
    	        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
    	    });

    	    addFormatToken(0, ['YY', 2], 0, function () {
    	        return this.year() % 100;
    	    });

    	    addFormatToken(0, ['YYYY', 4], 0, 'year');
    	    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    	    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    	    // ALIASES

    	    addUnitAlias('year', 'y');

    	    // PRIORITIES

    	    addUnitPriority('year', 1);

    	    // PARSING

    	    addRegexToken('Y', matchSigned);
    	    addRegexToken('YY', match1to2, match2);
    	    addRegexToken('YYYY', match1to4, match4);
    	    addRegexToken('YYYYY', match1to6, match6);
    	    addRegexToken('YYYYYY', match1to6, match6);

    	    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    	    addParseToken('YYYY', function (input, array) {
    	        array[YEAR] =
    	            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    	    });
    	    addParseToken('YY', function (input, array) {
    	        array[YEAR] = hooks.parseTwoDigitYear(input);
    	    });
    	    addParseToken('Y', function (input, array) {
    	        array[YEAR] = parseInt(input, 10);
    	    });

    	    // HELPERS

    	    function daysInYear(year) {
    	        return isLeapYear(year) ? 366 : 365;
    	    }

    	    // HOOKS

    	    hooks.parseTwoDigitYear = function (input) {
    	        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    	    };

    	    // MOMENTS

    	    var getSetYear = makeGetSet('FullYear', true);

    	    function getIsLeapYear() {
    	        return isLeapYear(this.year());
    	    }

    	    function createDate(y, m, d, h, M, s, ms) {
    	        // can't just apply() to create a date:
    	        // https://stackoverflow.com/q/181348
    	        var date;
    	        // the date constructor remaps years 0-99 to 1900-1999
    	        if (y < 100 && y >= 0) {
    	            // preserve leap years using a full 400 year cycle, then reset
    	            date = new Date(y + 400, m, d, h, M, s, ms);
    	            if (isFinite(date.getFullYear())) {
    	                date.setFullYear(y);
    	            }
    	        } else {
    	            date = new Date(y, m, d, h, M, s, ms);
    	        }

    	        return date;
    	    }

    	    function createUTCDate(y) {
    	        var date, args;
    	        // the Date.UTC function remaps years 0-99 to 1900-1999
    	        if (y < 100 && y >= 0) {
    	            args = Array.prototype.slice.call(arguments);
    	            // preserve leap years using a full 400 year cycle, then reset
    	            args[0] = y + 400;
    	            date = new Date(Date.UTC.apply(null, args));
    	            if (isFinite(date.getUTCFullYear())) {
    	                date.setUTCFullYear(y);
    	            }
    	        } else {
    	            date = new Date(Date.UTC.apply(null, arguments));
    	        }

    	        return date;
    	    }

    	    // start-of-first-week - start-of-year
    	    function firstWeekOffset(year, dow, doy) {
    	        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
    	            fwd = 7 + dow - doy,
    	            // first-week day local weekday -- which local weekday is fwd
    	            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    	        return -fwdlw + fwd - 1;
    	    }

    	    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    	    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    	        var localWeekday = (7 + weekday - dow) % 7,
    	            weekOffset = firstWeekOffset(year, dow, doy),
    	            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
    	            resYear,
    	            resDayOfYear;

    	        if (dayOfYear <= 0) {
    	            resYear = year - 1;
    	            resDayOfYear = daysInYear(resYear) + dayOfYear;
    	        } else if (dayOfYear > daysInYear(year)) {
    	            resYear = year + 1;
    	            resDayOfYear = dayOfYear - daysInYear(year);
    	        } else {
    	            resYear = year;
    	            resDayOfYear = dayOfYear;
    	        }

    	        return {
    	            year: resYear,
    	            dayOfYear: resDayOfYear,
    	        };
    	    }

    	    function weekOfYear(mom, dow, doy) {
    	        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
    	            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
    	            resWeek,
    	            resYear;

    	        if (week < 1) {
    	            resYear = mom.year() - 1;
    	            resWeek = week + weeksInYear(resYear, dow, doy);
    	        } else if (week > weeksInYear(mom.year(), dow, doy)) {
    	            resWeek = week - weeksInYear(mom.year(), dow, doy);
    	            resYear = mom.year() + 1;
    	        } else {
    	            resYear = mom.year();
    	            resWeek = week;
    	        }

    	        return {
    	            week: resWeek,
    	            year: resYear,
    	        };
    	    }

    	    function weeksInYear(year, dow, doy) {
    	        var weekOffset = firstWeekOffset(year, dow, doy),
    	            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    	        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    	    }

    	    // FORMATTING

    	    addFormatToken('w', ['ww', 2], 'wo', 'week');
    	    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    	    // ALIASES

    	    addUnitAlias('week', 'w');
    	    addUnitAlias('isoWeek', 'W');

    	    // PRIORITIES

    	    addUnitPriority('week', 5);
    	    addUnitPriority('isoWeek', 5);

    	    // PARSING

    	    addRegexToken('w', match1to2);
    	    addRegexToken('ww', match1to2, match2);
    	    addRegexToken('W', match1to2);
    	    addRegexToken('WW', match1to2, match2);

    	    addWeekParseToken(
    	        ['w', 'ww', 'W', 'WW'],
    	        function (input, week, config, token) {
    	            week[token.substr(0, 1)] = toInt(input);
    	        }
    	    );

    	    // HELPERS

    	    // LOCALES

    	    function localeWeek(mom) {
    	        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    	    }

    	    var defaultLocaleWeek = {
    	        dow: 0, // Sunday is the first day of the week.
    	        doy: 6, // The week that contains Jan 6th is the first week of the year.
    	    };

    	    function localeFirstDayOfWeek() {
    	        return this._week.dow;
    	    }

    	    function localeFirstDayOfYear() {
    	        return this._week.doy;
    	    }

    	    // MOMENTS

    	    function getSetWeek(input) {
    	        var week = this.localeData().week(this);
    	        return input == null ? week : this.add((input - week) * 7, 'd');
    	    }

    	    function getSetISOWeek(input) {
    	        var week = weekOfYear(this, 1, 4).week;
    	        return input == null ? week : this.add((input - week) * 7, 'd');
    	    }

    	    // FORMATTING

    	    addFormatToken('d', 0, 'do', 'day');

    	    addFormatToken('dd', 0, 0, function (format) {
    	        return this.localeData().weekdaysMin(this, format);
    	    });

    	    addFormatToken('ddd', 0, 0, function (format) {
    	        return this.localeData().weekdaysShort(this, format);
    	    });

    	    addFormatToken('dddd', 0, 0, function (format) {
    	        return this.localeData().weekdays(this, format);
    	    });

    	    addFormatToken('e', 0, 0, 'weekday');
    	    addFormatToken('E', 0, 0, 'isoWeekday');

    	    // ALIASES

    	    addUnitAlias('day', 'd');
    	    addUnitAlias('weekday', 'e');
    	    addUnitAlias('isoWeekday', 'E');

    	    // PRIORITY
    	    addUnitPriority('day', 11);
    	    addUnitPriority('weekday', 11);
    	    addUnitPriority('isoWeekday', 11);

    	    // PARSING

    	    addRegexToken('d', match1to2);
    	    addRegexToken('e', match1to2);
    	    addRegexToken('E', match1to2);
    	    addRegexToken('dd', function (isStrict, locale) {
    	        return locale.weekdaysMinRegex(isStrict);
    	    });
    	    addRegexToken('ddd', function (isStrict, locale) {
    	        return locale.weekdaysShortRegex(isStrict);
    	    });
    	    addRegexToken('dddd', function (isStrict, locale) {
    	        return locale.weekdaysRegex(isStrict);
    	    });

    	    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    	        var weekday = config._locale.weekdaysParse(input, token, config._strict);
    	        // if we didn't get a weekday name, mark the date as invalid
    	        if (weekday != null) {
    	            week.d = weekday;
    	        } else {
    	            getParsingFlags(config).invalidWeekday = input;
    	        }
    	    });

    	    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    	        week[token] = toInt(input);
    	    });

    	    // HELPERS

    	    function parseWeekday(input, locale) {
    	        if (typeof input !== 'string') {
    	            return input;
    	        }

    	        if (!isNaN(input)) {
    	            return parseInt(input, 10);
    	        }

    	        input = locale.weekdaysParse(input);
    	        if (typeof input === 'number') {
    	            return input;
    	        }

    	        return null;
    	    }

    	    function parseIsoWeekday(input, locale) {
    	        if (typeof input === 'string') {
    	            return locale.weekdaysParse(input) % 7 || 7;
    	        }
    	        return isNaN(input) ? null : input;
    	    }

    	    // LOCALES
    	    function shiftWeekdays(ws, n) {
    	        return ws.slice(n, 7).concat(ws.slice(0, n));
    	    }

    	    var defaultLocaleWeekdays =
    	            'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
    	        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
    	        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
    	        defaultWeekdaysRegex = matchWord,
    	        defaultWeekdaysShortRegex = matchWord,
    	        defaultWeekdaysMinRegex = matchWord;

    	    function localeWeekdays(m, format) {
    	        var weekdays = isArray(this._weekdays)
    	            ? this._weekdays
    	            : this._weekdays[
    	                  m && m !== true && this._weekdays.isFormat.test(format)
    	                      ? 'format'
    	                      : 'standalone'
    	              ];
    	        return m === true
    	            ? shiftWeekdays(weekdays, this._week.dow)
    	            : m
    	            ? weekdays[m.day()]
    	            : weekdays;
    	    }

    	    function localeWeekdaysShort(m) {
    	        return m === true
    	            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
    	            : m
    	            ? this._weekdaysShort[m.day()]
    	            : this._weekdaysShort;
    	    }

    	    function localeWeekdaysMin(m) {
    	        return m === true
    	            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
    	            : m
    	            ? this._weekdaysMin[m.day()]
    	            : this._weekdaysMin;
    	    }

    	    function handleStrictParse$1(weekdayName, format, strict) {
    	        var i,
    	            ii,
    	            mom,
    	            llc = weekdayName.toLocaleLowerCase();
    	        if (!this._weekdaysParse) {
    	            this._weekdaysParse = [];
    	            this._shortWeekdaysParse = [];
    	            this._minWeekdaysParse = [];

    	            for (i = 0; i < 7; ++i) {
    	                mom = createUTC([2000, 1]).day(i);
    	                this._minWeekdaysParse[i] = this.weekdaysMin(
    	                    mom,
    	                    ''
    	                ).toLocaleLowerCase();
    	                this._shortWeekdaysParse[i] = this.weekdaysShort(
    	                    mom,
    	                    ''
    	                ).toLocaleLowerCase();
    	                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
    	            }
    	        }

    	        if (strict) {
    	            if (format === 'dddd') {
    	                ii = indexOf.call(this._weekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else if (format === 'ddd') {
    	                ii = indexOf.call(this._shortWeekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else {
    	                ii = indexOf.call(this._minWeekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            }
    	        } else {
    	            if (format === 'dddd') {
    	                ii = indexOf.call(this._weekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._shortWeekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._minWeekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else if (format === 'ddd') {
    	                ii = indexOf.call(this._shortWeekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._weekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._minWeekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            } else {
    	                ii = indexOf.call(this._minWeekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._weekdaysParse, llc);
    	                if (ii !== -1) {
    	                    return ii;
    	                }
    	                ii = indexOf.call(this._shortWeekdaysParse, llc);
    	                return ii !== -1 ? ii : null;
    	            }
    	        }
    	    }

    	    function localeWeekdaysParse(weekdayName, format, strict) {
    	        var i, mom, regex;

    	        if (this._weekdaysParseExact) {
    	            return handleStrictParse$1.call(this, weekdayName, format, strict);
    	        }

    	        if (!this._weekdaysParse) {
    	            this._weekdaysParse = [];
    	            this._minWeekdaysParse = [];
    	            this._shortWeekdaysParse = [];
    	            this._fullWeekdaysParse = [];
    	        }

    	        for (i = 0; i < 7; i++) {
    	            // make the regex if we don't have it already

    	            mom = createUTC([2000, 1]).day(i);
    	            if (strict && !this._fullWeekdaysParse[i]) {
    	                this._fullWeekdaysParse[i] = new RegExp(
    	                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
    	                    'i'
    	                );
    	                this._shortWeekdaysParse[i] = new RegExp(
    	                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
    	                    'i'
    	                );
    	                this._minWeekdaysParse[i] = new RegExp(
    	                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
    	                    'i'
    	                );
    	            }
    	            if (!this._weekdaysParse[i]) {
    	                regex =
    	                    '^' +
    	                    this.weekdays(mom, '') +
    	                    '|^' +
    	                    this.weekdaysShort(mom, '') +
    	                    '|^' +
    	                    this.weekdaysMin(mom, '');
    	                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
    	            }
    	            // test the regex
    	            if (
    	                strict &&
    	                format === 'dddd' &&
    	                this._fullWeekdaysParse[i].test(weekdayName)
    	            ) {
    	                return i;
    	            } else if (
    	                strict &&
    	                format === 'ddd' &&
    	                this._shortWeekdaysParse[i].test(weekdayName)
    	            ) {
    	                return i;
    	            } else if (
    	                strict &&
    	                format === 'dd' &&
    	                this._minWeekdaysParse[i].test(weekdayName)
    	            ) {
    	                return i;
    	            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
    	                return i;
    	            }
    	        }
    	    }

    	    // MOMENTS

    	    function getSetDayOfWeek(input) {
    	        if (!this.isValid()) {
    	            return input != null ? this : NaN;
    	        }
    	        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    	        if (input != null) {
    	            input = parseWeekday(input, this.localeData());
    	            return this.add(input - day, 'd');
    	        } else {
    	            return day;
    	        }
    	    }

    	    function getSetLocaleDayOfWeek(input) {
    	        if (!this.isValid()) {
    	            return input != null ? this : NaN;
    	        }
    	        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    	        return input == null ? weekday : this.add(input - weekday, 'd');
    	    }

    	    function getSetISODayOfWeek(input) {
    	        if (!this.isValid()) {
    	            return input != null ? this : NaN;
    	        }

    	        // behaves the same as moment#day except
    	        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    	        // as a setter, sunday should belong to the previous week.

    	        if (input != null) {
    	            var weekday = parseIsoWeekday(input, this.localeData());
    	            return this.day(this.day() % 7 ? weekday : weekday - 7);
    	        } else {
    	            return this.day() || 7;
    	        }
    	    }

    	    function weekdaysRegex(isStrict) {
    	        if (this._weekdaysParseExact) {
    	            if (!hasOwnProp(this, '_weekdaysRegex')) {
    	                computeWeekdaysParse.call(this);
    	            }
    	            if (isStrict) {
    	                return this._weekdaysStrictRegex;
    	            } else {
    	                return this._weekdaysRegex;
    	            }
    	        } else {
    	            if (!hasOwnProp(this, '_weekdaysRegex')) {
    	                this._weekdaysRegex = defaultWeekdaysRegex;
    	            }
    	            return this._weekdaysStrictRegex && isStrict
    	                ? this._weekdaysStrictRegex
    	                : this._weekdaysRegex;
    	        }
    	    }

    	    function weekdaysShortRegex(isStrict) {
    	        if (this._weekdaysParseExact) {
    	            if (!hasOwnProp(this, '_weekdaysRegex')) {
    	                computeWeekdaysParse.call(this);
    	            }
    	            if (isStrict) {
    	                return this._weekdaysShortStrictRegex;
    	            } else {
    	                return this._weekdaysShortRegex;
    	            }
    	        } else {
    	            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
    	                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
    	            }
    	            return this._weekdaysShortStrictRegex && isStrict
    	                ? this._weekdaysShortStrictRegex
    	                : this._weekdaysShortRegex;
    	        }
    	    }

    	    function weekdaysMinRegex(isStrict) {
    	        if (this._weekdaysParseExact) {
    	            if (!hasOwnProp(this, '_weekdaysRegex')) {
    	                computeWeekdaysParse.call(this);
    	            }
    	            if (isStrict) {
    	                return this._weekdaysMinStrictRegex;
    	            } else {
    	                return this._weekdaysMinRegex;
    	            }
    	        } else {
    	            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
    	                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
    	            }
    	            return this._weekdaysMinStrictRegex && isStrict
    	                ? this._weekdaysMinStrictRegex
    	                : this._weekdaysMinRegex;
    	        }
    	    }

    	    function computeWeekdaysParse() {
    	        function cmpLenRev(a, b) {
    	            return b.length - a.length;
    	        }

    	        var minPieces = [],
    	            shortPieces = [],
    	            longPieces = [],
    	            mixedPieces = [],
    	            i,
    	            mom,
    	            minp,
    	            shortp,
    	            longp;
    	        for (i = 0; i < 7; i++) {
    	            // make the regex if we don't have it already
    	            mom = createUTC([2000, 1]).day(i);
    	            minp = regexEscape(this.weekdaysMin(mom, ''));
    	            shortp = regexEscape(this.weekdaysShort(mom, ''));
    	            longp = regexEscape(this.weekdays(mom, ''));
    	            minPieces.push(minp);
    	            shortPieces.push(shortp);
    	            longPieces.push(longp);
    	            mixedPieces.push(minp);
    	            mixedPieces.push(shortp);
    	            mixedPieces.push(longp);
    	        }
    	        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    	        // will match the longer piece.
    	        minPieces.sort(cmpLenRev);
    	        shortPieces.sort(cmpLenRev);
    	        longPieces.sort(cmpLenRev);
    	        mixedPieces.sort(cmpLenRev);

    	        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    	        this._weekdaysShortRegex = this._weekdaysRegex;
    	        this._weekdaysMinRegex = this._weekdaysRegex;

    	        this._weekdaysStrictRegex = new RegExp(
    	            '^(' + longPieces.join('|') + ')',
    	            'i'
    	        );
    	        this._weekdaysShortStrictRegex = new RegExp(
    	            '^(' + shortPieces.join('|') + ')',
    	            'i'
    	        );
    	        this._weekdaysMinStrictRegex = new RegExp(
    	            '^(' + minPieces.join('|') + ')',
    	            'i'
    	        );
    	    }

    	    // FORMATTING

    	    function hFormat() {
    	        return this.hours() % 12 || 12;
    	    }

    	    function kFormat() {
    	        return this.hours() || 24;
    	    }

    	    addFormatToken('H', ['HH', 2], 0, 'hour');
    	    addFormatToken('h', ['hh', 2], 0, hFormat);
    	    addFormatToken('k', ['kk', 2], 0, kFormat);

    	    addFormatToken('hmm', 0, 0, function () {
    	        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    	    });

    	    addFormatToken('hmmss', 0, 0, function () {
    	        return (
    	            '' +
    	            hFormat.apply(this) +
    	            zeroFill(this.minutes(), 2) +
    	            zeroFill(this.seconds(), 2)
    	        );
    	    });

    	    addFormatToken('Hmm', 0, 0, function () {
    	        return '' + this.hours() + zeroFill(this.minutes(), 2);
    	    });

    	    addFormatToken('Hmmss', 0, 0, function () {
    	        return (
    	            '' +
    	            this.hours() +
    	            zeroFill(this.minutes(), 2) +
    	            zeroFill(this.seconds(), 2)
    	        );
    	    });

    	    function meridiem(token, lowercase) {
    	        addFormatToken(token, 0, 0, function () {
    	            return this.localeData().meridiem(
    	                this.hours(),
    	                this.minutes(),
    	                lowercase
    	            );
    	        });
    	    }

    	    meridiem('a', true);
    	    meridiem('A', false);

    	    // ALIASES

    	    addUnitAlias('hour', 'h');

    	    // PRIORITY
    	    addUnitPriority('hour', 13);

    	    // PARSING

    	    function matchMeridiem(isStrict, locale) {
    	        return locale._meridiemParse;
    	    }

    	    addRegexToken('a', matchMeridiem);
    	    addRegexToken('A', matchMeridiem);
    	    addRegexToken('H', match1to2);
    	    addRegexToken('h', match1to2);
    	    addRegexToken('k', match1to2);
    	    addRegexToken('HH', match1to2, match2);
    	    addRegexToken('hh', match1to2, match2);
    	    addRegexToken('kk', match1to2, match2);

    	    addRegexToken('hmm', match3to4);
    	    addRegexToken('hmmss', match5to6);
    	    addRegexToken('Hmm', match3to4);
    	    addRegexToken('Hmmss', match5to6);

    	    addParseToken(['H', 'HH'], HOUR);
    	    addParseToken(['k', 'kk'], function (input, array, config) {
    	        var kInput = toInt(input);
    	        array[HOUR] = kInput === 24 ? 0 : kInput;
    	    });
    	    addParseToken(['a', 'A'], function (input, array, config) {
    	        config._isPm = config._locale.isPM(input);
    	        config._meridiem = input;
    	    });
    	    addParseToken(['h', 'hh'], function (input, array, config) {
    	        array[HOUR] = toInt(input);
    	        getParsingFlags(config).bigHour = true;
    	    });
    	    addParseToken('hmm', function (input, array, config) {
    	        var pos = input.length - 2;
    	        array[HOUR] = toInt(input.substr(0, pos));
    	        array[MINUTE] = toInt(input.substr(pos));
    	        getParsingFlags(config).bigHour = true;
    	    });
    	    addParseToken('hmmss', function (input, array, config) {
    	        var pos1 = input.length - 4,
    	            pos2 = input.length - 2;
    	        array[HOUR] = toInt(input.substr(0, pos1));
    	        array[MINUTE] = toInt(input.substr(pos1, 2));
    	        array[SECOND] = toInt(input.substr(pos2));
    	        getParsingFlags(config).bigHour = true;
    	    });
    	    addParseToken('Hmm', function (input, array, config) {
    	        var pos = input.length - 2;
    	        array[HOUR] = toInt(input.substr(0, pos));
    	        array[MINUTE] = toInt(input.substr(pos));
    	    });
    	    addParseToken('Hmmss', function (input, array, config) {
    	        var pos1 = input.length - 4,
    	            pos2 = input.length - 2;
    	        array[HOUR] = toInt(input.substr(0, pos1));
    	        array[MINUTE] = toInt(input.substr(pos1, 2));
    	        array[SECOND] = toInt(input.substr(pos2));
    	    });

    	    // LOCALES

    	    function localeIsPM(input) {
    	        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    	        // Using charAt should be more compatible.
    	        return (input + '').toLowerCase().charAt(0) === 'p';
    	    }

    	    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
    	        // Setting the hour should keep the time, because the user explicitly
    	        // specified which hour they want. So trying to maintain the same hour (in
    	        // a new timezone) makes sense. Adding/subtracting hours does not follow
    	        // this rule.
    	        getSetHour = makeGetSet('Hours', true);

    	    function localeMeridiem(hours, minutes, isLower) {
    	        if (hours > 11) {
    	            return isLower ? 'pm' : 'PM';
    	        } else {
    	            return isLower ? 'am' : 'AM';
    	        }
    	    }

    	    var baseConfig = {
    	        calendar: defaultCalendar,
    	        longDateFormat: defaultLongDateFormat,
    	        invalidDate: defaultInvalidDate,
    	        ordinal: defaultOrdinal,
    	        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    	        relativeTime: defaultRelativeTime,

    	        months: defaultLocaleMonths,
    	        monthsShort: defaultLocaleMonthsShort,

    	        week: defaultLocaleWeek,

    	        weekdays: defaultLocaleWeekdays,
    	        weekdaysMin: defaultLocaleWeekdaysMin,
    	        weekdaysShort: defaultLocaleWeekdaysShort,

    	        meridiemParse: defaultLocaleMeridiemParse,
    	    };

    	    // internal storage for locale config files
    	    var locales = {},
    	        localeFamilies = {},
    	        globalLocale;

    	    function commonPrefix(arr1, arr2) {
    	        var i,
    	            minl = Math.min(arr1.length, arr2.length);
    	        for (i = 0; i < minl; i += 1) {
    	            if (arr1[i] !== arr2[i]) {
    	                return i;
    	            }
    	        }
    	        return minl;
    	    }

    	    function normalizeLocale(key) {
    	        return key ? key.toLowerCase().replace('_', '-') : key;
    	    }

    	    // pick the locale from the array
    	    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    	    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    	    function chooseLocale(names) {
    	        var i = 0,
    	            j,
    	            next,
    	            locale,
    	            split;

    	        while (i < names.length) {
    	            split = normalizeLocale(names[i]).split('-');
    	            j = split.length;
    	            next = normalizeLocale(names[i + 1]);
    	            next = next ? next.split('-') : null;
    	            while (j > 0) {
    	                locale = loadLocale(split.slice(0, j).join('-'));
    	                if (locale) {
    	                    return locale;
    	                }
    	                if (
    	                    next &&
    	                    next.length >= j &&
    	                    commonPrefix(split, next) >= j - 1
    	                ) {
    	                    //the next array item is better than a shallower substring of this one
    	                    break;
    	                }
    	                j--;
    	            }
    	            i++;
    	        }
    	        return globalLocale;
    	    }

    	    function isLocaleNameSane(name) {
    	        // Prevent names that look like filesystem paths, i.e contain '/' or '\'
    	        return name.match('^[^/\\\\]*$') != null;
    	    }

    	    function loadLocale(name) {
    	        var oldLocale = null,
    	            aliasedRequire;
    	        // TODO: Find a better way to register and load all the locales in Node
    	        if (
    	            locales[name] === undefined &&
    	            'object' !== 'undefined' &&
    	            module &&
    	            module.exports &&
    	            isLocaleNameSane(name)
    	        ) {
    	            try {
    	                oldLocale = globalLocale._abbr;
    	                aliasedRequire = commonjsRequire;
    	                aliasedRequire('./locale/' + name);
    	                getSetGlobalLocale(oldLocale);
    	            } catch (e) {
    	                // mark as not found to avoid repeating expensive file require call causing high CPU
    	                // when trying to find en-US, en_US, en-us for every format call
    	                locales[name] = null; // null means not found
    	            }
    	        }
    	        return locales[name];
    	    }

    	    // This function will load locale and then set the global locale.  If
    	    // no arguments are passed in, it will simply return the current global
    	    // locale key.
    	    function getSetGlobalLocale(key, values) {
    	        var data;
    	        if (key) {
    	            if (isUndefined(values)) {
    	                data = getLocale(key);
    	            } else {
    	                data = defineLocale(key, values);
    	            }

    	            if (data) {
    	                // moment.duration._locale = moment._locale = data;
    	                globalLocale = data;
    	            } else {
    	                if (typeof console !== 'undefined' && console.warn) {
    	                    //warn user if arguments are passed but the locale could not be set
    	                    console.warn(
    	                        'Locale ' + key + ' not found. Did you forget to load it?'
    	                    );
    	                }
    	            }
    	        }

    	        return globalLocale._abbr;
    	    }

    	    function defineLocale(name, config) {
    	        if (config !== null) {
    	            var locale,
    	                parentConfig = baseConfig;
    	            config.abbr = name;
    	            if (locales[name] != null) {
    	                deprecateSimple(
    	                    'defineLocaleOverride',
    	                    'use moment.updateLocale(localeName, config) to change ' +
    	                        'an existing locale. moment.defineLocale(localeName, ' +
    	                        'config) should only be used for creating a new locale ' +
    	                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
    	                );
    	                parentConfig = locales[name]._config;
    	            } else if (config.parentLocale != null) {
    	                if (locales[config.parentLocale] != null) {
    	                    parentConfig = locales[config.parentLocale]._config;
    	                } else {
    	                    locale = loadLocale(config.parentLocale);
    	                    if (locale != null) {
    	                        parentConfig = locale._config;
    	                    } else {
    	                        if (!localeFamilies[config.parentLocale]) {
    	                            localeFamilies[config.parentLocale] = [];
    	                        }
    	                        localeFamilies[config.parentLocale].push({
    	                            name: name,
    	                            config: config,
    	                        });
    	                        return null;
    	                    }
    	                }
    	            }
    	            locales[name] = new Locale(mergeConfigs(parentConfig, config));

    	            if (localeFamilies[name]) {
    	                localeFamilies[name].forEach(function (x) {
    	                    defineLocale(x.name, x.config);
    	                });
    	            }

    	            // backwards compat for now: also set the locale
    	            // make sure we set the locale AFTER all child locales have been
    	            // created, so we won't end up with the child locale set.
    	            getSetGlobalLocale(name);

    	            return locales[name];
    	        } else {
    	            // useful for testing
    	            delete locales[name];
    	            return null;
    	        }
    	    }

    	    function updateLocale(name, config) {
    	        if (config != null) {
    	            var locale,
    	                tmpLocale,
    	                parentConfig = baseConfig;

    	            if (locales[name] != null && locales[name].parentLocale != null) {
    	                // Update existing child locale in-place to avoid memory-leaks
    	                locales[name].set(mergeConfigs(locales[name]._config, config));
    	            } else {
    	                // MERGE
    	                tmpLocale = loadLocale(name);
    	                if (tmpLocale != null) {
    	                    parentConfig = tmpLocale._config;
    	                }
    	                config = mergeConfigs(parentConfig, config);
    	                if (tmpLocale == null) {
    	                    // updateLocale is called for creating a new locale
    	                    // Set abbr so it will have a name (getters return
    	                    // undefined otherwise).
    	                    config.abbr = name;
    	                }
    	                locale = new Locale(config);
    	                locale.parentLocale = locales[name];
    	                locales[name] = locale;
    	            }

    	            // backwards compat for now: also set the locale
    	            getSetGlobalLocale(name);
    	        } else {
    	            // pass null for config to unupdate, useful for tests
    	            if (locales[name] != null) {
    	                if (locales[name].parentLocale != null) {
    	                    locales[name] = locales[name].parentLocale;
    	                    if (name === getSetGlobalLocale()) {
    	                        getSetGlobalLocale(name);
    	                    }
    	                } else if (locales[name] != null) {
    	                    delete locales[name];
    	                }
    	            }
    	        }
    	        return locales[name];
    	    }

    	    // returns locale data
    	    function getLocale(key) {
    	        var locale;

    	        if (key && key._locale && key._locale._abbr) {
    	            key = key._locale._abbr;
    	        }

    	        if (!key) {
    	            return globalLocale;
    	        }

    	        if (!isArray(key)) {
    	            //short-circuit everything else
    	            locale = loadLocale(key);
    	            if (locale) {
    	                return locale;
    	            }
    	            key = [key];
    	        }

    	        return chooseLocale(key);
    	    }

    	    function listLocales() {
    	        return keys(locales);
    	    }

    	    function checkOverflow(m) {
    	        var overflow,
    	            a = m._a;

    	        if (a && getParsingFlags(m).overflow === -2) {
    	            overflow =
    	                a[MONTH] < 0 || a[MONTH] > 11
    	                    ? MONTH
    	                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
    	                    ? DATE
    	                    : a[HOUR] < 0 ||
    	                      a[HOUR] > 24 ||
    	                      (a[HOUR] === 24 &&
    	                          (a[MINUTE] !== 0 ||
    	                              a[SECOND] !== 0 ||
    	                              a[MILLISECOND] !== 0))
    	                    ? HOUR
    	                    : a[MINUTE] < 0 || a[MINUTE] > 59
    	                    ? MINUTE
    	                    : a[SECOND] < 0 || a[SECOND] > 59
    	                    ? SECOND
    	                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
    	                    ? MILLISECOND
    	                    : -1;

    	            if (
    	                getParsingFlags(m)._overflowDayOfYear &&
    	                (overflow < YEAR || overflow > DATE)
    	            ) {
    	                overflow = DATE;
    	            }
    	            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
    	                overflow = WEEK;
    	            }
    	            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
    	                overflow = WEEKDAY;
    	            }

    	            getParsingFlags(m).overflow = overflow;
    	        }

    	        return m;
    	    }

    	    // iso 8601 regex
    	    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    	    var extendedIsoRegex =
    	            /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
    	        basicIsoRegex =
    	            /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
    	        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
    	        isoDates = [
    	            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    	            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    	            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    	            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    	            ['YYYY-DDD', /\d{4}-\d{3}/],
    	            ['YYYY-MM', /\d{4}-\d\d/, false],
    	            ['YYYYYYMMDD', /[+-]\d{10}/],
    	            ['YYYYMMDD', /\d{8}/],
    	            ['GGGG[W]WWE', /\d{4}W\d{3}/],
    	            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    	            ['YYYYDDD', /\d{7}/],
    	            ['YYYYMM', /\d{6}/, false],
    	            ['YYYY', /\d{4}/, false],
    	        ],
    	        // iso time formats and regexes
    	        isoTimes = [
    	            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    	            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    	            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    	            ['HH:mm', /\d\d:\d\d/],
    	            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    	            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    	            ['HHmmss', /\d\d\d\d\d\d/],
    	            ['HHmm', /\d\d\d\d/],
    	            ['HH', /\d\d/],
    	        ],
    	        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
    	        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
    	        rfc2822 =
    	            /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
    	        obsOffsets = {
    	            UT: 0,
    	            GMT: 0,
    	            EDT: -4 * 60,
    	            EST: -5 * 60,
    	            CDT: -5 * 60,
    	            CST: -6 * 60,
    	            MDT: -6 * 60,
    	            MST: -7 * 60,
    	            PDT: -7 * 60,
    	            PST: -8 * 60,
    	        };

    	    // date from iso format
    	    function configFromISO(config) {
    	        var i,
    	            l,
    	            string = config._i,
    	            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
    	            allowTime,
    	            dateFormat,
    	            timeFormat,
    	            tzFormat,
    	            isoDatesLen = isoDates.length,
    	            isoTimesLen = isoTimes.length;

    	        if (match) {
    	            getParsingFlags(config).iso = true;
    	            for (i = 0, l = isoDatesLen; i < l; i++) {
    	                if (isoDates[i][1].exec(match[1])) {
    	                    dateFormat = isoDates[i][0];
    	                    allowTime = isoDates[i][2] !== false;
    	                    break;
    	                }
    	            }
    	            if (dateFormat == null) {
    	                config._isValid = false;
    	                return;
    	            }
    	            if (match[3]) {
    	                for (i = 0, l = isoTimesLen; i < l; i++) {
    	                    if (isoTimes[i][1].exec(match[3])) {
    	                        // match[2] should be 'T' or space
    	                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
    	                        break;
    	                    }
    	                }
    	                if (timeFormat == null) {
    	                    config._isValid = false;
    	                    return;
    	                }
    	            }
    	            if (!allowTime && timeFormat != null) {
    	                config._isValid = false;
    	                return;
    	            }
    	            if (match[4]) {
    	                if (tzRegex.exec(match[4])) {
    	                    tzFormat = 'Z';
    	                } else {
    	                    config._isValid = false;
    	                    return;
    	                }
    	            }
    	            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
    	            configFromStringAndFormat(config);
    	        } else {
    	            config._isValid = false;
    	        }
    	    }

    	    function extractFromRFC2822Strings(
    	        yearStr,
    	        monthStr,
    	        dayStr,
    	        hourStr,
    	        minuteStr,
    	        secondStr
    	    ) {
    	        var result = [
    	            untruncateYear(yearStr),
    	            defaultLocaleMonthsShort.indexOf(monthStr),
    	            parseInt(dayStr, 10),
    	            parseInt(hourStr, 10),
    	            parseInt(minuteStr, 10),
    	        ];

    	        if (secondStr) {
    	            result.push(parseInt(secondStr, 10));
    	        }

    	        return result;
    	    }

    	    function untruncateYear(yearStr) {
    	        var year = parseInt(yearStr, 10);
    	        if (year <= 49) {
    	            return 2000 + year;
    	        } else if (year <= 999) {
    	            return 1900 + year;
    	        }
    	        return year;
    	    }

    	    function preprocessRFC2822(s) {
    	        // Remove comments and folding whitespace and replace multiple-spaces with a single space
    	        return s
    	            .replace(/\([^()]*\)|[\n\t]/g, ' ')
    	            .replace(/(\s\s+)/g, ' ')
    	            .replace(/^\s\s*/, '')
    	            .replace(/\s\s*$/, '');
    	    }

    	    function checkWeekday(weekdayStr, parsedInput, config) {
    	        if (weekdayStr) {
    	            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
    	            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
    	                weekdayActual = new Date(
    	                    parsedInput[0],
    	                    parsedInput[1],
    	                    parsedInput[2]
    	                ).getDay();
    	            if (weekdayProvided !== weekdayActual) {
    	                getParsingFlags(config).weekdayMismatch = true;
    	                config._isValid = false;
    	                return false;
    	            }
    	        }
    	        return true;
    	    }

    	    function calculateOffset(obsOffset, militaryOffset, numOffset) {
    	        if (obsOffset) {
    	            return obsOffsets[obsOffset];
    	        } else if (militaryOffset) {
    	            // the only allowed military tz is Z
    	            return 0;
    	        } else {
    	            var hm = parseInt(numOffset, 10),
    	                m = hm % 100,
    	                h = (hm - m) / 100;
    	            return h * 60 + m;
    	        }
    	    }

    	    // date and time from ref 2822 format
    	    function configFromRFC2822(config) {
    	        var match = rfc2822.exec(preprocessRFC2822(config._i)),
    	            parsedArray;
    	        if (match) {
    	            parsedArray = extractFromRFC2822Strings(
    	                match[4],
    	                match[3],
    	                match[2],
    	                match[5],
    	                match[6],
    	                match[7]
    	            );
    	            if (!checkWeekday(match[1], parsedArray, config)) {
    	                return;
    	            }

    	            config._a = parsedArray;
    	            config._tzm = calculateOffset(match[8], match[9], match[10]);

    	            config._d = createUTCDate.apply(null, config._a);
    	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

    	            getParsingFlags(config).rfc2822 = true;
    	        } else {
    	            config._isValid = false;
    	        }
    	    }

    	    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
    	    function configFromString(config) {
    	        var matched = aspNetJsonRegex.exec(config._i);
    	        if (matched !== null) {
    	            config._d = new Date(+matched[1]);
    	            return;
    	        }

    	        configFromISO(config);
    	        if (config._isValid === false) {
    	            delete config._isValid;
    	        } else {
    	            return;
    	        }

    	        configFromRFC2822(config);
    	        if (config._isValid === false) {
    	            delete config._isValid;
    	        } else {
    	            return;
    	        }

    	        if (config._strict) {
    	            config._isValid = false;
    	        } else {
    	            // Final attempt, use Input Fallback
    	            hooks.createFromInputFallback(config);
    	        }
    	    }

    	    hooks.createFromInputFallback = deprecate(
    	        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
    	            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
    	            'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    	        function (config) {
    	            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    	        }
    	    );

    	    // Pick the first defined of two or three arguments.
    	    function defaults(a, b, c) {
    	        if (a != null) {
    	            return a;
    	        }
    	        if (b != null) {
    	            return b;
    	        }
    	        return c;
    	    }

    	    function currentDateArray(config) {
    	        // hooks is actually the exported moment object
    	        var nowValue = new Date(hooks.now());
    	        if (config._useUTC) {
    	            return [
    	                nowValue.getUTCFullYear(),
    	                nowValue.getUTCMonth(),
    	                nowValue.getUTCDate(),
    	            ];
    	        }
    	        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    	    }

    	    // convert an array to a date.
    	    // the array should mirror the parameters below
    	    // note: all values past the year are optional and will default to the lowest possible value.
    	    // [year, month, day , hour, minute, second, millisecond]
    	    function configFromArray(config) {
    	        var i,
    	            date,
    	            input = [],
    	            currentDate,
    	            expectedWeekday,
    	            yearToUse;

    	        if (config._d) {
    	            return;
    	        }

    	        currentDate = currentDateArray(config);

    	        //compute day of the year from weeks and weekdays
    	        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
    	            dayOfYearFromWeekInfo(config);
    	        }

    	        //if the day of the year is set, figure out what it is
    	        if (config._dayOfYear != null) {
    	            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

    	            if (
    	                config._dayOfYear > daysInYear(yearToUse) ||
    	                config._dayOfYear === 0
    	            ) {
    	                getParsingFlags(config)._overflowDayOfYear = true;
    	            }

    	            date = createUTCDate(yearToUse, 0, config._dayOfYear);
    	            config._a[MONTH] = date.getUTCMonth();
    	            config._a[DATE] = date.getUTCDate();
    	        }

    	        // Default to current date.
    	        // * if no year, month, day of month are given, default to today
    	        // * if day of month is given, default month and year
    	        // * if month is given, default only year
    	        // * if year is given, don't default anything
    	        for (i = 0; i < 3 && config._a[i] == null; ++i) {
    	            config._a[i] = input[i] = currentDate[i];
    	        }

    	        // Zero out whatever was not defaulted, including time
    	        for (; i < 7; i++) {
    	            config._a[i] = input[i] =
    	                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
    	        }

    	        // Check for 24:00:00.000
    	        if (
    	            config._a[HOUR] === 24 &&
    	            config._a[MINUTE] === 0 &&
    	            config._a[SECOND] === 0 &&
    	            config._a[MILLISECOND] === 0
    	        ) {
    	            config._nextDay = true;
    	            config._a[HOUR] = 0;
    	        }

    	        config._d = (config._useUTC ? createUTCDate : createDate).apply(
    	            null,
    	            input
    	        );
    	        expectedWeekday = config._useUTC
    	            ? config._d.getUTCDay()
    	            : config._d.getDay();

    	        // Apply timezone offset from input. The actual utcOffset can be changed
    	        // with parseZone.
    	        if (config._tzm != null) {
    	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    	        }

    	        if (config._nextDay) {
    	            config._a[HOUR] = 24;
    	        }

    	        // check for mismatching day of week
    	        if (
    	            config._w &&
    	            typeof config._w.d !== 'undefined' &&
    	            config._w.d !== expectedWeekday
    	        ) {
    	            getParsingFlags(config).weekdayMismatch = true;
    	        }
    	    }

    	    function dayOfYearFromWeekInfo(config) {
    	        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

    	        w = config._w;
    	        if (w.GG != null || w.W != null || w.E != null) {
    	            dow = 1;
    	            doy = 4;

    	            // TODO: We need to take the current isoWeekYear, but that depends on
    	            // how we interpret now (local, utc, fixed offset). So create
    	            // a now version of current config (take local/utc/offset flags, and
    	            // create now).
    	            weekYear = defaults(
    	                w.GG,
    	                config._a[YEAR],
    	                weekOfYear(createLocal(), 1, 4).year
    	            );
    	            week = defaults(w.W, 1);
    	            weekday = defaults(w.E, 1);
    	            if (weekday < 1 || weekday > 7) {
    	                weekdayOverflow = true;
    	            }
    	        } else {
    	            dow = config._locale._week.dow;
    	            doy = config._locale._week.doy;

    	            curWeek = weekOfYear(createLocal(), dow, doy);

    	            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

    	            // Default to current week.
    	            week = defaults(w.w, curWeek.week);

    	            if (w.d != null) {
    	                // weekday -- low day numbers are considered next week
    	                weekday = w.d;
    	                if (weekday < 0 || weekday > 6) {
    	                    weekdayOverflow = true;
    	                }
    	            } else if (w.e != null) {
    	                // local weekday -- counting starts from beginning of week
    	                weekday = w.e + dow;
    	                if (w.e < 0 || w.e > 6) {
    	                    weekdayOverflow = true;
    	                }
    	            } else {
    	                // default to beginning of week
    	                weekday = dow;
    	            }
    	        }
    	        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
    	            getParsingFlags(config)._overflowWeeks = true;
    	        } else if (weekdayOverflow != null) {
    	            getParsingFlags(config)._overflowWeekday = true;
    	        } else {
    	            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
    	            config._a[YEAR] = temp.year;
    	            config._dayOfYear = temp.dayOfYear;
    	        }
    	    }

    	    // constant that refers to the ISO standard
    	    hooks.ISO_8601 = function () {};

    	    // constant that refers to the RFC 2822 form
    	    hooks.RFC_2822 = function () {};

    	    // date from string and format string
    	    function configFromStringAndFormat(config) {
    	        // TODO: Move this to another part of the creation flow to prevent circular deps
    	        if (config._f === hooks.ISO_8601) {
    	            configFromISO(config);
    	            return;
    	        }
    	        if (config._f === hooks.RFC_2822) {
    	            configFromRFC2822(config);
    	            return;
    	        }
    	        config._a = [];
    	        getParsingFlags(config).empty = true;

    	        // This array is used to make a Date, either with `new Date` or `Date.UTC`
    	        var string = '' + config._i,
    	            i,
    	            parsedInput,
    	            tokens,
    	            token,
    	            skipped,
    	            stringLength = string.length,
    	            totalParsedInputLength = 0,
    	            era,
    	            tokenLen;

    	        tokens =
    	            expandFormat(config._f, config._locale).match(formattingTokens) || [];
    	        tokenLen = tokens.length;
    	        for (i = 0; i < tokenLen; i++) {
    	            token = tokens[i];
    	            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
    	                [])[0];
    	            if (parsedInput) {
    	                skipped = string.substr(0, string.indexOf(parsedInput));
    	                if (skipped.length > 0) {
    	                    getParsingFlags(config).unusedInput.push(skipped);
    	                }
    	                string = string.slice(
    	                    string.indexOf(parsedInput) + parsedInput.length
    	                );
    	                totalParsedInputLength += parsedInput.length;
    	            }
    	            // don't parse if it's not a known token
    	            if (formatTokenFunctions[token]) {
    	                if (parsedInput) {
    	                    getParsingFlags(config).empty = false;
    	                } else {
    	                    getParsingFlags(config).unusedTokens.push(token);
    	                }
    	                addTimeToArrayFromToken(token, parsedInput, config);
    	            } else if (config._strict && !parsedInput) {
    	                getParsingFlags(config).unusedTokens.push(token);
    	            }
    	        }

    	        // add remaining unparsed input length to the string
    	        getParsingFlags(config).charsLeftOver =
    	            stringLength - totalParsedInputLength;
    	        if (string.length > 0) {
    	            getParsingFlags(config).unusedInput.push(string);
    	        }

    	        // clear _12h flag if hour is <= 12
    	        if (
    	            config._a[HOUR] <= 12 &&
    	            getParsingFlags(config).bigHour === true &&
    	            config._a[HOUR] > 0
    	        ) {
    	            getParsingFlags(config).bigHour = undefined;
    	        }

    	        getParsingFlags(config).parsedDateParts = config._a.slice(0);
    	        getParsingFlags(config).meridiem = config._meridiem;
    	        // handle meridiem
    	        config._a[HOUR] = meridiemFixWrap(
    	            config._locale,
    	            config._a[HOUR],
    	            config._meridiem
    	        );

    	        // handle era
    	        era = getParsingFlags(config).era;
    	        if (era !== null) {
    	            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
    	        }

    	        configFromArray(config);
    	        checkOverflow(config);
    	    }

    	    function meridiemFixWrap(locale, hour, meridiem) {
    	        var isPm;

    	        if (meridiem == null) {
    	            // nothing to do
    	            return hour;
    	        }
    	        if (locale.meridiemHour != null) {
    	            return locale.meridiemHour(hour, meridiem);
    	        } else if (locale.isPM != null) {
    	            // Fallback
    	            isPm = locale.isPM(meridiem);
    	            if (isPm && hour < 12) {
    	                hour += 12;
    	            }
    	            if (!isPm && hour === 12) {
    	                hour = 0;
    	            }
    	            return hour;
    	        } else {
    	            // this is not supposed to happen
    	            return hour;
    	        }
    	    }

    	    // date from string and array of format strings
    	    function configFromStringAndArray(config) {
    	        var tempConfig,
    	            bestMoment,
    	            scoreToBeat,
    	            i,
    	            currentScore,
    	            validFormatFound,
    	            bestFormatIsValid = false,
    	            configfLen = config._f.length;

    	        if (configfLen === 0) {
    	            getParsingFlags(config).invalidFormat = true;
    	            config._d = new Date(NaN);
    	            return;
    	        }

    	        for (i = 0; i < configfLen; i++) {
    	            currentScore = 0;
    	            validFormatFound = false;
    	            tempConfig = copyConfig({}, config);
    	            if (config._useUTC != null) {
    	                tempConfig._useUTC = config._useUTC;
    	            }
    	            tempConfig._f = config._f[i];
    	            configFromStringAndFormat(tempConfig);

    	            if (isValid(tempConfig)) {
    	                validFormatFound = true;
    	            }

    	            // if there is any input that was not parsed add a penalty for that format
    	            currentScore += getParsingFlags(tempConfig).charsLeftOver;

    	            //or tokens
    	            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

    	            getParsingFlags(tempConfig).score = currentScore;

    	            if (!bestFormatIsValid) {
    	                if (
    	                    scoreToBeat == null ||
    	                    currentScore < scoreToBeat ||
    	                    validFormatFound
    	                ) {
    	                    scoreToBeat = currentScore;
    	                    bestMoment = tempConfig;
    	                    if (validFormatFound) {
    	                        bestFormatIsValid = true;
    	                    }
    	                }
    	            } else {
    	                if (currentScore < scoreToBeat) {
    	                    scoreToBeat = currentScore;
    	                    bestMoment = tempConfig;
    	                }
    	            }
    	        }

    	        extend(config, bestMoment || tempConfig);
    	    }

    	    function configFromObject(config) {
    	        if (config._d) {
    	            return;
    	        }

    	        var i = normalizeObjectUnits(config._i),
    	            dayOrDate = i.day === undefined ? i.date : i.day;
    	        config._a = map(
    	            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
    	            function (obj) {
    	                return obj && parseInt(obj, 10);
    	            }
    	        );

    	        configFromArray(config);
    	    }

    	    function createFromConfig(config) {
    	        var res = new Moment(checkOverflow(prepareConfig(config)));
    	        if (res._nextDay) {
    	            // Adding is smart enough around DST
    	            res.add(1, 'd');
    	            res._nextDay = undefined;
    	        }

    	        return res;
    	    }

    	    function prepareConfig(config) {
    	        var input = config._i,
    	            format = config._f;

    	        config._locale = config._locale || getLocale(config._l);

    	        if (input === null || (format === undefined && input === '')) {
    	            return createInvalid({ nullInput: true });
    	        }

    	        if (typeof input === 'string') {
    	            config._i = input = config._locale.preparse(input);
    	        }

    	        if (isMoment(input)) {
    	            return new Moment(checkOverflow(input));
    	        } else if (isDate(input)) {
    	            config._d = input;
    	        } else if (isArray(format)) {
    	            configFromStringAndArray(config);
    	        } else if (format) {
    	            configFromStringAndFormat(config);
    	        } else {
    	            configFromInput(config);
    	        }

    	        if (!isValid(config)) {
    	            config._d = null;
    	        }

    	        return config;
    	    }

    	    function configFromInput(config) {
    	        var input = config._i;
    	        if (isUndefined(input)) {
    	            config._d = new Date(hooks.now());
    	        } else if (isDate(input)) {
    	            config._d = new Date(input.valueOf());
    	        } else if (typeof input === 'string') {
    	            configFromString(config);
    	        } else if (isArray(input)) {
    	            config._a = map(input.slice(0), function (obj) {
    	                return parseInt(obj, 10);
    	            });
    	            configFromArray(config);
    	        } else if (isObject(input)) {
    	            configFromObject(config);
    	        } else if (isNumber(input)) {
    	            // from milliseconds
    	            config._d = new Date(input);
    	        } else {
    	            hooks.createFromInputFallback(config);
    	        }
    	    }

    	    function createLocalOrUTC(input, format, locale, strict, isUTC) {
    	        var c = {};

    	        if (format === true || format === false) {
    	            strict = format;
    	            format = undefined;
    	        }

    	        if (locale === true || locale === false) {
    	            strict = locale;
    	            locale = undefined;
    	        }

    	        if (
    	            (isObject(input) && isObjectEmpty(input)) ||
    	            (isArray(input) && input.length === 0)
    	        ) {
    	            input = undefined;
    	        }
    	        // object construction must be done this way.
    	        // https://github.com/moment/moment/issues/1423
    	        c._isAMomentObject = true;
    	        c._useUTC = c._isUTC = isUTC;
    	        c._l = locale;
    	        c._i = input;
    	        c._f = format;
    	        c._strict = strict;

    	        return createFromConfig(c);
    	    }

    	    function createLocal(input, format, locale, strict) {
    	        return createLocalOrUTC(input, format, locale, strict, false);
    	    }

    	    var prototypeMin = deprecate(
    	            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    	            function () {
    	                var other = createLocal.apply(null, arguments);
    	                if (this.isValid() && other.isValid()) {
    	                    return other < this ? this : other;
    	                } else {
    	                    return createInvalid();
    	                }
    	            }
    	        ),
    	        prototypeMax = deprecate(
    	            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    	            function () {
    	                var other = createLocal.apply(null, arguments);
    	                if (this.isValid() && other.isValid()) {
    	                    return other > this ? this : other;
    	                } else {
    	                    return createInvalid();
    	                }
    	            }
    	        );

    	    // Pick a moment m from moments so that m[fn](other) is true for all
    	    // other. This relies on the function fn to be transitive.
    	    //
    	    // moments should either be an array of moment objects or an array, whose
    	    // first element is an array of moment objects.
    	    function pickBy(fn, moments) {
    	        var res, i;
    	        if (moments.length === 1 && isArray(moments[0])) {
    	            moments = moments[0];
    	        }
    	        if (!moments.length) {
    	            return createLocal();
    	        }
    	        res = moments[0];
    	        for (i = 1; i < moments.length; ++i) {
    	            if (!moments[i].isValid() || moments[i][fn](res)) {
    	                res = moments[i];
    	            }
    	        }
    	        return res;
    	    }

    	    // TODO: Use [].sort instead?
    	    function min() {
    	        var args = [].slice.call(arguments, 0);

    	        return pickBy('isBefore', args);
    	    }

    	    function max() {
    	        var args = [].slice.call(arguments, 0);

    	        return pickBy('isAfter', args);
    	    }

    	    var now = function () {
    	        return Date.now ? Date.now() : +new Date();
    	    };

    	    var ordering = [
    	        'year',
    	        'quarter',
    	        'month',
    	        'week',
    	        'day',
    	        'hour',
    	        'minute',
    	        'second',
    	        'millisecond',
    	    ];

    	    function isDurationValid(m) {
    	        var key,
    	            unitHasDecimal = false,
    	            i,
    	            orderLen = ordering.length;
    	        for (key in m) {
    	            if (
    	                hasOwnProp(m, key) &&
    	                !(
    	                    indexOf.call(ordering, key) !== -1 &&
    	                    (m[key] == null || !isNaN(m[key]))
    	                )
    	            ) {
    	                return false;
    	            }
    	        }

    	        for (i = 0; i < orderLen; ++i) {
    	            if (m[ordering[i]]) {
    	                if (unitHasDecimal) {
    	                    return false; // only allow non-integers for smallest unit
    	                }
    	                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
    	                    unitHasDecimal = true;
    	                }
    	            }
    	        }

    	        return true;
    	    }

    	    function isValid$1() {
    	        return this._isValid;
    	    }

    	    function createInvalid$1() {
    	        return createDuration(NaN);
    	    }

    	    function Duration(duration) {
    	        var normalizedInput = normalizeObjectUnits(duration),
    	            years = normalizedInput.year || 0,
    	            quarters = normalizedInput.quarter || 0,
    	            months = normalizedInput.month || 0,
    	            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
    	            days = normalizedInput.day || 0,
    	            hours = normalizedInput.hour || 0,
    	            minutes = normalizedInput.minute || 0,
    	            seconds = normalizedInput.second || 0,
    	            milliseconds = normalizedInput.millisecond || 0;

    	        this._isValid = isDurationValid(normalizedInput);

    	        // representation for dateAddRemove
    	        this._milliseconds =
    	            +milliseconds +
    	            seconds * 1e3 + // 1000
    	            minutes * 6e4 + // 1000 * 60
    	            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    	        // Because of dateAddRemove treats 24 hours as different from a
    	        // day when working around DST, we need to store them separately
    	        this._days = +days + weeks * 7;
    	        // It is impossible to translate months into days without knowing
    	        // which months you are are talking about, so we have to store
    	        // it separately.
    	        this._months = +months + quarters * 3 + years * 12;

    	        this._data = {};

    	        this._locale = getLocale();

    	        this._bubble();
    	    }

    	    function isDuration(obj) {
    	        return obj instanceof Duration;
    	    }

    	    function absRound(number) {
    	        if (number < 0) {
    	            return Math.round(-1 * number) * -1;
    	        } else {
    	            return Math.round(number);
    	        }
    	    }

    	    // compare two arrays, return the number of differences
    	    function compareArrays(array1, array2, dontConvert) {
    	        var len = Math.min(array1.length, array2.length),
    	            lengthDiff = Math.abs(array1.length - array2.length),
    	            diffs = 0,
    	            i;
    	        for (i = 0; i < len; i++) {
    	            if (
    	                (dontConvert && array1[i] !== array2[i]) ||
    	                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
    	            ) {
    	                diffs++;
    	            }
    	        }
    	        return diffs + lengthDiff;
    	    }

    	    // FORMATTING

    	    function offset(token, separator) {
    	        addFormatToken(token, 0, 0, function () {
    	            var offset = this.utcOffset(),
    	                sign = '+';
    	            if (offset < 0) {
    	                offset = -offset;
    	                sign = '-';
    	            }
    	            return (
    	                sign +
    	                zeroFill(~~(offset / 60), 2) +
    	                separator +
    	                zeroFill(~~offset % 60, 2)
    	            );
    	        });
    	    }

    	    offset('Z', ':');
    	    offset('ZZ', '');

    	    // PARSING

    	    addRegexToken('Z', matchShortOffset);
    	    addRegexToken('ZZ', matchShortOffset);
    	    addParseToken(['Z', 'ZZ'], function (input, array, config) {
    	        config._useUTC = true;
    	        config._tzm = offsetFromString(matchShortOffset, input);
    	    });

    	    // HELPERS

    	    // timezone chunker
    	    // '+10:00' > ['10',  '00']
    	    // '-1530'  > ['-15', '30']
    	    var chunkOffset = /([\+\-]|\d\d)/gi;

    	    function offsetFromString(matcher, string) {
    	        var matches = (string || '').match(matcher),
    	            chunk,
    	            parts,
    	            minutes;

    	        if (matches === null) {
    	            return null;
    	        }

    	        chunk = matches[matches.length - 1] || [];
    	        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    	        minutes = +(parts[1] * 60) + toInt(parts[2]);

    	        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
    	    }

    	    // Return a moment from input, that is local/utc/zone equivalent to model.
    	    function cloneWithOffset(input, model) {
    	        var res, diff;
    	        if (model._isUTC) {
    	            res = model.clone();
    	            diff =
    	                (isMoment(input) || isDate(input)
    	                    ? input.valueOf()
    	                    : createLocal(input).valueOf()) - res.valueOf();
    	            // Use low-level api, because this fn is low-level api.
    	            res._d.setTime(res._d.valueOf() + diff);
    	            hooks.updateOffset(res, false);
    	            return res;
    	        } else {
    	            return createLocal(input).local();
    	        }
    	    }

    	    function getDateOffset(m) {
    	        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    	        // https://github.com/moment/moment/pull/1871
    	        return -Math.round(m._d.getTimezoneOffset());
    	    }

    	    // HOOKS

    	    // This function will be called whenever a moment is mutated.
    	    // It is intended to keep the offset in sync with the timezone.
    	    hooks.updateOffset = function () {};

    	    // MOMENTS

    	    // keepLocalTime = true means only change the timezone, without
    	    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    	    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    	    // +0200, so we adjust the time as needed, to be valid.
    	    //
    	    // Keeping the time actually adds/subtracts (one hour)
    	    // from the actual represented time. That is why we call updateOffset
    	    // a second time. In case it wants us to change the offset again
    	    // _changeInProgress == true case, then we have to adjust, because
    	    // there is no such time in the given timezone.
    	    function getSetOffset(input, keepLocalTime, keepMinutes) {
    	        var offset = this._offset || 0,
    	            localAdjust;
    	        if (!this.isValid()) {
    	            return input != null ? this : NaN;
    	        }
    	        if (input != null) {
    	            if (typeof input === 'string') {
    	                input = offsetFromString(matchShortOffset, input);
    	                if (input === null) {
    	                    return this;
    	                }
    	            } else if (Math.abs(input) < 16 && !keepMinutes) {
    	                input = input * 60;
    	            }
    	            if (!this._isUTC && keepLocalTime) {
    	                localAdjust = getDateOffset(this);
    	            }
    	            this._offset = input;
    	            this._isUTC = true;
    	            if (localAdjust != null) {
    	                this.add(localAdjust, 'm');
    	            }
    	            if (offset !== input) {
    	                if (!keepLocalTime || this._changeInProgress) {
    	                    addSubtract(
    	                        this,
    	                        createDuration(input - offset, 'm'),
    	                        1,
    	                        false
    	                    );
    	                } else if (!this._changeInProgress) {
    	                    this._changeInProgress = true;
    	                    hooks.updateOffset(this, true);
    	                    this._changeInProgress = null;
    	                }
    	            }
    	            return this;
    	        } else {
    	            return this._isUTC ? offset : getDateOffset(this);
    	        }
    	    }

    	    function getSetZone(input, keepLocalTime) {
    	        if (input != null) {
    	            if (typeof input !== 'string') {
    	                input = -input;
    	            }

    	            this.utcOffset(input, keepLocalTime);

    	            return this;
    	        } else {
    	            return -this.utcOffset();
    	        }
    	    }

    	    function setOffsetToUTC(keepLocalTime) {
    	        return this.utcOffset(0, keepLocalTime);
    	    }

    	    function setOffsetToLocal(keepLocalTime) {
    	        if (this._isUTC) {
    	            this.utcOffset(0, keepLocalTime);
    	            this._isUTC = false;

    	            if (keepLocalTime) {
    	                this.subtract(getDateOffset(this), 'm');
    	            }
    	        }
    	        return this;
    	    }

    	    function setOffsetToParsedOffset() {
    	        if (this._tzm != null) {
    	            this.utcOffset(this._tzm, false, true);
    	        } else if (typeof this._i === 'string') {
    	            var tZone = offsetFromString(matchOffset, this._i);
    	            if (tZone != null) {
    	                this.utcOffset(tZone);
    	            } else {
    	                this.utcOffset(0, true);
    	            }
    	        }
    	        return this;
    	    }

    	    function hasAlignedHourOffset(input) {
    	        if (!this.isValid()) {
    	            return false;
    	        }
    	        input = input ? createLocal(input).utcOffset() : 0;

    	        return (this.utcOffset() - input) % 60 === 0;
    	    }

    	    function isDaylightSavingTime() {
    	        return (
    	            this.utcOffset() > this.clone().month(0).utcOffset() ||
    	            this.utcOffset() > this.clone().month(5).utcOffset()
    	        );
    	    }

    	    function isDaylightSavingTimeShifted() {
    	        if (!isUndefined(this._isDSTShifted)) {
    	            return this._isDSTShifted;
    	        }

    	        var c = {},
    	            other;

    	        copyConfig(c, this);
    	        c = prepareConfig(c);

    	        if (c._a) {
    	            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
    	            this._isDSTShifted =
    	                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
    	        } else {
    	            this._isDSTShifted = false;
    	        }

    	        return this._isDSTShifted;
    	    }

    	    function isLocal() {
    	        return this.isValid() ? !this._isUTC : false;
    	    }

    	    function isUtcOffset() {
    	        return this.isValid() ? this._isUTC : false;
    	    }

    	    function isUtc() {
    	        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    	    }

    	    // ASP.NET json date format regex
    	    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
    	        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    	        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    	        // and further modified to allow for strings containing both week and day
    	        isoRegex =
    	            /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    	    function createDuration(input, key) {
    	        var duration = input,
    	            // matching against regexp is expensive, do it on demand
    	            match = null,
    	            sign,
    	            ret,
    	            diffRes;

    	        if (isDuration(input)) {
    	            duration = {
    	                ms: input._milliseconds,
    	                d: input._days,
    	                M: input._months,
    	            };
    	        } else if (isNumber(input) || !isNaN(+input)) {
    	            duration = {};
    	            if (key) {
    	                duration[key] = +input;
    	            } else {
    	                duration.milliseconds = +input;
    	            }
    	        } else if ((match = aspNetRegex.exec(input))) {
    	            sign = match[1] === '-' ? -1 : 1;
    	            duration = {
    	                y: 0,
    	                d: toInt(match[DATE]) * sign,
    	                h: toInt(match[HOUR]) * sign,
    	                m: toInt(match[MINUTE]) * sign,
    	                s: toInt(match[SECOND]) * sign,
    	                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
    	            };
    	        } else if ((match = isoRegex.exec(input))) {
    	            sign = match[1] === '-' ? -1 : 1;
    	            duration = {
    	                y: parseIso(match[2], sign),
    	                M: parseIso(match[3], sign),
    	                w: parseIso(match[4], sign),
    	                d: parseIso(match[5], sign),
    	                h: parseIso(match[6], sign),
    	                m: parseIso(match[7], sign),
    	                s: parseIso(match[8], sign),
    	            };
    	        } else if (duration == null) {
    	            // checks for null or undefined
    	            duration = {};
    	        } else if (
    	            typeof duration === 'object' &&
    	            ('from' in duration || 'to' in duration)
    	        ) {
    	            diffRes = momentsDifference(
    	                createLocal(duration.from),
    	                createLocal(duration.to)
    	            );

    	            duration = {};
    	            duration.ms = diffRes.milliseconds;
    	            duration.M = diffRes.months;
    	        }

    	        ret = new Duration(duration);

    	        if (isDuration(input) && hasOwnProp(input, '_locale')) {
    	            ret._locale = input._locale;
    	        }

    	        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
    	            ret._isValid = input._isValid;
    	        }

    	        return ret;
    	    }

    	    createDuration.fn = Duration.prototype;
    	    createDuration.invalid = createInvalid$1;

    	    function parseIso(inp, sign) {
    	        // We'd normally use ~~inp for this, but unfortunately it also
    	        // converts floats to ints.
    	        // inp may be undefined, so careful calling replace on it.
    	        var res = inp && parseFloat(inp.replace(',', '.'));
    	        // apply sign while we're at it
    	        return (isNaN(res) ? 0 : res) * sign;
    	    }

    	    function positiveMomentsDifference(base, other) {
    	        var res = {};

    	        res.months =
    	            other.month() - base.month() + (other.year() - base.year()) * 12;
    	        if (base.clone().add(res.months, 'M').isAfter(other)) {
    	            --res.months;
    	        }

    	        res.milliseconds = +other - +base.clone().add(res.months, 'M');

    	        return res;
    	    }

    	    function momentsDifference(base, other) {
    	        var res;
    	        if (!(base.isValid() && other.isValid())) {
    	            return { milliseconds: 0, months: 0 };
    	        }

    	        other = cloneWithOffset(other, base);
    	        if (base.isBefore(other)) {
    	            res = positiveMomentsDifference(base, other);
    	        } else {
    	            res = positiveMomentsDifference(other, base);
    	            res.milliseconds = -res.milliseconds;
    	            res.months = -res.months;
    	        }

    	        return res;
    	    }

    	    // TODO: remove 'name' arg after deprecation is removed
    	    function createAdder(direction, name) {
    	        return function (val, period) {
    	            var dur, tmp;
    	            //invert the arguments, but complain about it
    	            if (period !== null && !isNaN(+period)) {
    	                deprecateSimple(
    	                    name,
    	                    'moment().' +
    	                        name +
    	                        '(period, number) is deprecated. Please use moment().' +
    	                        name +
    	                        '(number, period). ' +
    	                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
    	                );
    	                tmp = val;
    	                val = period;
    	                period = tmp;
    	            }

    	            dur = createDuration(val, period);
    	            addSubtract(this, dur, direction);
    	            return this;
    	        };
    	    }

    	    function addSubtract(mom, duration, isAdding, updateOffset) {
    	        var milliseconds = duration._milliseconds,
    	            days = absRound(duration._days),
    	            months = absRound(duration._months);

    	        if (!mom.isValid()) {
    	            // No op
    	            return;
    	        }

    	        updateOffset = updateOffset == null ? true : updateOffset;

    	        if (months) {
    	            setMonth(mom, get(mom, 'Month') + months * isAdding);
    	        }
    	        if (days) {
    	            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    	        }
    	        if (milliseconds) {
    	            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    	        }
    	        if (updateOffset) {
    	            hooks.updateOffset(mom, days || months);
    	        }
    	    }

    	    var add = createAdder(1, 'add'),
    	        subtract = createAdder(-1, 'subtract');

    	    function isString(input) {
    	        return typeof input === 'string' || input instanceof String;
    	    }

    	    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
    	    function isMomentInput(input) {
    	        return (
    	            isMoment(input) ||
    	            isDate(input) ||
    	            isString(input) ||
    	            isNumber(input) ||
    	            isNumberOrStringArray(input) ||
    	            isMomentInputObject(input) ||
    	            input === null ||
    	            input === undefined
    	        );
    	    }

    	    function isMomentInputObject(input) {
    	        var objectTest = isObject(input) && !isObjectEmpty(input),
    	            propertyTest = false,
    	            properties = [
    	                'years',
    	                'year',
    	                'y',
    	                'months',
    	                'month',
    	                'M',
    	                'days',
    	                'day',
    	                'd',
    	                'dates',
    	                'date',
    	                'D',
    	                'hours',
    	                'hour',
    	                'h',
    	                'minutes',
    	                'minute',
    	                'm',
    	                'seconds',
    	                'second',
    	                's',
    	                'milliseconds',
    	                'millisecond',
    	                'ms',
    	            ],
    	            i,
    	            property,
    	            propertyLen = properties.length;

    	        for (i = 0; i < propertyLen; i += 1) {
    	            property = properties[i];
    	            propertyTest = propertyTest || hasOwnProp(input, property);
    	        }

    	        return objectTest && propertyTest;
    	    }

    	    function isNumberOrStringArray(input) {
    	        var arrayTest = isArray(input),
    	            dataTypeTest = false;
    	        if (arrayTest) {
    	            dataTypeTest =
    	                input.filter(function (item) {
    	                    return !isNumber(item) && isString(input);
    	                }).length === 0;
    	        }
    	        return arrayTest && dataTypeTest;
    	    }

    	    function isCalendarSpec(input) {
    	        var objectTest = isObject(input) && !isObjectEmpty(input),
    	            propertyTest = false,
    	            properties = [
    	                'sameDay',
    	                'nextDay',
    	                'lastDay',
    	                'nextWeek',
    	                'lastWeek',
    	                'sameElse',
    	            ],
    	            i,
    	            property;

    	        for (i = 0; i < properties.length; i += 1) {
    	            property = properties[i];
    	            propertyTest = propertyTest || hasOwnProp(input, property);
    	        }

    	        return objectTest && propertyTest;
    	    }

    	    function getCalendarFormat(myMoment, now) {
    	        var diff = myMoment.diff(now, 'days', true);
    	        return diff < -6
    	            ? 'sameElse'
    	            : diff < -1
    	            ? 'lastWeek'
    	            : diff < 0
    	            ? 'lastDay'
    	            : diff < 1
    	            ? 'sameDay'
    	            : diff < 2
    	            ? 'nextDay'
    	            : diff < 7
    	            ? 'nextWeek'
    	            : 'sameElse';
    	    }

    	    function calendar$1(time, formats) {
    	        // Support for single parameter, formats only overload to the calendar function
    	        if (arguments.length === 1) {
    	            if (!arguments[0]) {
    	                time = undefined;
    	                formats = undefined;
    	            } else if (isMomentInput(arguments[0])) {
    	                time = arguments[0];
    	                formats = undefined;
    	            } else if (isCalendarSpec(arguments[0])) {
    	                formats = arguments[0];
    	                time = undefined;
    	            }
    	        }
    	        // We want to compare the start of today, vs this.
    	        // Getting start-of-today depends on whether we're local/utc/offset or not.
    	        var now = time || createLocal(),
    	            sod = cloneWithOffset(now, this).startOf('day'),
    	            format = hooks.calendarFormat(this, sod) || 'sameElse',
    	            output =
    	                formats &&
    	                (isFunction(formats[format])
    	                    ? formats[format].call(this, now)
    	                    : formats[format]);

    	        return this.format(
    	            output || this.localeData().calendar(format, this, createLocal(now))
    	        );
    	    }

    	    function clone() {
    	        return new Moment(this);
    	    }

    	    function isAfter(input, units) {
    	        var localInput = isMoment(input) ? input : createLocal(input);
    	        if (!(this.isValid() && localInput.isValid())) {
    	            return false;
    	        }
    	        units = normalizeUnits(units) || 'millisecond';
    	        if (units === 'millisecond') {
    	            return this.valueOf() > localInput.valueOf();
    	        } else {
    	            return localInput.valueOf() < this.clone().startOf(units).valueOf();
    	        }
    	    }

    	    function isBefore(input, units) {
    	        var localInput = isMoment(input) ? input : createLocal(input);
    	        if (!(this.isValid() && localInput.isValid())) {
    	            return false;
    	        }
    	        units = normalizeUnits(units) || 'millisecond';
    	        if (units === 'millisecond') {
    	            return this.valueOf() < localInput.valueOf();
    	        } else {
    	            return this.clone().endOf(units).valueOf() < localInput.valueOf();
    	        }
    	    }

    	    function isBetween(from, to, units, inclusivity) {
    	        var localFrom = isMoment(from) ? from : createLocal(from),
    	            localTo = isMoment(to) ? to : createLocal(to);
    	        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
    	            return false;
    	        }
    	        inclusivity = inclusivity || '()';
    	        return (
    	            (inclusivity[0] === '('
    	                ? this.isAfter(localFrom, units)
    	                : !this.isBefore(localFrom, units)) &&
    	            (inclusivity[1] === ')'
    	                ? this.isBefore(localTo, units)
    	                : !this.isAfter(localTo, units))
    	        );
    	    }

    	    function isSame(input, units) {
    	        var localInput = isMoment(input) ? input : createLocal(input),
    	            inputMs;
    	        if (!(this.isValid() && localInput.isValid())) {
    	            return false;
    	        }
    	        units = normalizeUnits(units) || 'millisecond';
    	        if (units === 'millisecond') {
    	            return this.valueOf() === localInput.valueOf();
    	        } else {
    	            inputMs = localInput.valueOf();
    	            return (
    	                this.clone().startOf(units).valueOf() <= inputMs &&
    	                inputMs <= this.clone().endOf(units).valueOf()
    	            );
    	        }
    	    }

    	    function isSameOrAfter(input, units) {
    	        return this.isSame(input, units) || this.isAfter(input, units);
    	    }

    	    function isSameOrBefore(input, units) {
    	        return this.isSame(input, units) || this.isBefore(input, units);
    	    }

    	    function diff(input, units, asFloat) {
    	        var that, zoneDelta, output;

    	        if (!this.isValid()) {
    	            return NaN;
    	        }

    	        that = cloneWithOffset(input, this);

    	        if (!that.isValid()) {
    	            return NaN;
    	        }

    	        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    	        units = normalizeUnits(units);

    	        switch (units) {
    	            case 'year':
    	                output = monthDiff(this, that) / 12;
    	                break;
    	            case 'month':
    	                output = monthDiff(this, that);
    	                break;
    	            case 'quarter':
    	                output = monthDiff(this, that) / 3;
    	                break;
    	            case 'second':
    	                output = (this - that) / 1e3;
    	                break; // 1000
    	            case 'minute':
    	                output = (this - that) / 6e4;
    	                break; // 1000 * 60
    	            case 'hour':
    	                output = (this - that) / 36e5;
    	                break; // 1000 * 60 * 60
    	            case 'day':
    	                output = (this - that - zoneDelta) / 864e5;
    	                break; // 1000 * 60 * 60 * 24, negate dst
    	            case 'week':
    	                output = (this - that - zoneDelta) / 6048e5;
    	                break; // 1000 * 60 * 60 * 24 * 7, negate dst
    	            default:
    	                output = this - that;
    	        }

    	        return asFloat ? output : absFloor(output);
    	    }

    	    function monthDiff(a, b) {
    	        if (a.date() < b.date()) {
    	            // end-of-month calculations work correct when the start month has more
    	            // days than the end month.
    	            return -monthDiff(b, a);
    	        }
    	        // difference in months
    	        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
    	            // b is in (anchor - 1 month, anchor + 1 month)
    	            anchor = a.clone().add(wholeMonthDiff, 'months'),
    	            anchor2,
    	            adjust;

    	        if (b - anchor < 0) {
    	            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
    	            // linear across the month
    	            adjust = (b - anchor) / (anchor - anchor2);
    	        } else {
    	            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
    	            // linear across the month
    	            adjust = (b - anchor) / (anchor2 - anchor);
    	        }

    	        //check for negative zero, return zero if negative zero
    	        return -(wholeMonthDiff + adjust) || 0;
    	    }

    	    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    	    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    	    function toString() {
    	        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    	    }

    	    function toISOString(keepOffset) {
    	        if (!this.isValid()) {
    	            return null;
    	        }
    	        var utc = keepOffset !== true,
    	            m = utc ? this.clone().utc() : this;
    	        if (m.year() < 0 || m.year() > 9999) {
    	            return formatMoment(
    	                m,
    	                utc
    	                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
    	                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
    	            );
    	        }
    	        if (isFunction(Date.prototype.toISOString)) {
    	            // native implementation is ~50x faster, use it when we can
    	            if (utc) {
    	                return this.toDate().toISOString();
    	            } else {
    	                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
    	                    .toISOString()
    	                    .replace('Z', formatMoment(m, 'Z'));
    	            }
    	        }
    	        return formatMoment(
    	            m,
    	            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
    	        );
    	    }

    	    /**
    	     * Return a human readable representation of a moment that can
    	     * also be evaluated to get a new moment which is the same
    	     *
    	     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
    	     */
    	    function inspect() {
    	        if (!this.isValid()) {
    	            return 'moment.invalid(/* ' + this._i + ' */)';
    	        }
    	        var func = 'moment',
    	            zone = '',
    	            prefix,
    	            year,
    	            datetime,
    	            suffix;
    	        if (!this.isLocal()) {
    	            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
    	            zone = 'Z';
    	        }
    	        prefix = '[' + func + '("]';
    	        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
    	        datetime = '-MM-DD[T]HH:mm:ss.SSS';
    	        suffix = zone + '[")]';

    	        return this.format(prefix + year + datetime + suffix);
    	    }

    	    function format(inputString) {
    	        if (!inputString) {
    	            inputString = this.isUtc()
    	                ? hooks.defaultFormatUtc
    	                : hooks.defaultFormat;
    	        }
    	        var output = formatMoment(this, inputString);
    	        return this.localeData().postformat(output);
    	    }

    	    function from(time, withoutSuffix) {
    	        if (
    	            this.isValid() &&
    	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
    	        ) {
    	            return createDuration({ to: this, from: time })
    	                .locale(this.locale())
    	                .humanize(!withoutSuffix);
    	        } else {
    	            return this.localeData().invalidDate();
    	        }
    	    }

    	    function fromNow(withoutSuffix) {
    	        return this.from(createLocal(), withoutSuffix);
    	    }

    	    function to(time, withoutSuffix) {
    	        if (
    	            this.isValid() &&
    	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
    	        ) {
    	            return createDuration({ from: this, to: time })
    	                .locale(this.locale())
    	                .humanize(!withoutSuffix);
    	        } else {
    	            return this.localeData().invalidDate();
    	        }
    	    }

    	    function toNow(withoutSuffix) {
    	        return this.to(createLocal(), withoutSuffix);
    	    }

    	    // If passed a locale key, it will set the locale for this
    	    // instance.  Otherwise, it will return the locale configuration
    	    // variables for this instance.
    	    function locale(key) {
    	        var newLocaleData;

    	        if (key === undefined) {
    	            return this._locale._abbr;
    	        } else {
    	            newLocaleData = getLocale(key);
    	            if (newLocaleData != null) {
    	                this._locale = newLocaleData;
    	            }
    	            return this;
    	        }
    	    }

    	    var lang = deprecate(
    	        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    	        function (key) {
    	            if (key === undefined) {
    	                return this.localeData();
    	            } else {
    	                return this.locale(key);
    	            }
    	        }
    	    );

    	    function localeData() {
    	        return this._locale;
    	    }

    	    var MS_PER_SECOND = 1000,
    	        MS_PER_MINUTE = 60 * MS_PER_SECOND,
    	        MS_PER_HOUR = 60 * MS_PER_MINUTE,
    	        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    	    // actual modulo - handles negative numbers (for dates before 1970):
    	    function mod$1(dividend, divisor) {
    	        return ((dividend % divisor) + divisor) % divisor;
    	    }

    	    function localStartOfDate(y, m, d) {
    	        // the date constructor remaps years 0-99 to 1900-1999
    	        if (y < 100 && y >= 0) {
    	            // preserve leap years using a full 400 year cycle, then reset
    	            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
    	        } else {
    	            return new Date(y, m, d).valueOf();
    	        }
    	    }

    	    function utcStartOfDate(y, m, d) {
    	        // Date.UTC remaps years 0-99 to 1900-1999
    	        if (y < 100 && y >= 0) {
    	            // preserve leap years using a full 400 year cycle, then reset
    	            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
    	        } else {
    	            return Date.UTC(y, m, d);
    	        }
    	    }

    	    function startOf(units) {
    	        var time, startOfDate;
    	        units = normalizeUnits(units);
    	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
    	            return this;
    	        }

    	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

    	        switch (units) {
    	            case 'year':
    	                time = startOfDate(this.year(), 0, 1);
    	                break;
    	            case 'quarter':
    	                time = startOfDate(
    	                    this.year(),
    	                    this.month() - (this.month() % 3),
    	                    1
    	                );
    	                break;
    	            case 'month':
    	                time = startOfDate(this.year(), this.month(), 1);
    	                break;
    	            case 'week':
    	                time = startOfDate(
    	                    this.year(),
    	                    this.month(),
    	                    this.date() - this.weekday()
    	                );
    	                break;
    	            case 'isoWeek':
    	                time = startOfDate(
    	                    this.year(),
    	                    this.month(),
    	                    this.date() - (this.isoWeekday() - 1)
    	                );
    	                break;
    	            case 'day':
    	            case 'date':
    	                time = startOfDate(this.year(), this.month(), this.date());
    	                break;
    	            case 'hour':
    	                time = this._d.valueOf();
    	                time -= mod$1(
    	                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
    	                    MS_PER_HOUR
    	                );
    	                break;
    	            case 'minute':
    	                time = this._d.valueOf();
    	                time -= mod$1(time, MS_PER_MINUTE);
    	                break;
    	            case 'second':
    	                time = this._d.valueOf();
    	                time -= mod$1(time, MS_PER_SECOND);
    	                break;
    	        }

    	        this._d.setTime(time);
    	        hooks.updateOffset(this, true);
    	        return this;
    	    }

    	    function endOf(units) {
    	        var time, startOfDate;
    	        units = normalizeUnits(units);
    	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
    	            return this;
    	        }

    	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

    	        switch (units) {
    	            case 'year':
    	                time = startOfDate(this.year() + 1, 0, 1) - 1;
    	                break;
    	            case 'quarter':
    	                time =
    	                    startOfDate(
    	                        this.year(),
    	                        this.month() - (this.month() % 3) + 3,
    	                        1
    	                    ) - 1;
    	                break;
    	            case 'month':
    	                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
    	                break;
    	            case 'week':
    	                time =
    	                    startOfDate(
    	                        this.year(),
    	                        this.month(),
    	                        this.date() - this.weekday() + 7
    	                    ) - 1;
    	                break;
    	            case 'isoWeek':
    	                time =
    	                    startOfDate(
    	                        this.year(),
    	                        this.month(),
    	                        this.date() - (this.isoWeekday() - 1) + 7
    	                    ) - 1;
    	                break;
    	            case 'day':
    	            case 'date':
    	                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
    	                break;
    	            case 'hour':
    	                time = this._d.valueOf();
    	                time +=
    	                    MS_PER_HOUR -
    	                    mod$1(
    	                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
    	                        MS_PER_HOUR
    	                    ) -
    	                    1;
    	                break;
    	            case 'minute':
    	                time = this._d.valueOf();
    	                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
    	                break;
    	            case 'second':
    	                time = this._d.valueOf();
    	                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
    	                break;
    	        }

    	        this._d.setTime(time);
    	        hooks.updateOffset(this, true);
    	        return this;
    	    }

    	    function valueOf() {
    	        return this._d.valueOf() - (this._offset || 0) * 60000;
    	    }

    	    function unix() {
    	        return Math.floor(this.valueOf() / 1000);
    	    }

    	    function toDate() {
    	        return new Date(this.valueOf());
    	    }

    	    function toArray() {
    	        var m = this;
    	        return [
    	            m.year(),
    	            m.month(),
    	            m.date(),
    	            m.hour(),
    	            m.minute(),
    	            m.second(),
    	            m.millisecond(),
    	        ];
    	    }

    	    function toObject() {
    	        var m = this;
    	        return {
    	            years: m.year(),
    	            months: m.month(),
    	            date: m.date(),
    	            hours: m.hours(),
    	            minutes: m.minutes(),
    	            seconds: m.seconds(),
    	            milliseconds: m.milliseconds(),
    	        };
    	    }

    	    function toJSON() {
    	        // new Date(NaN).toJSON() === null
    	        return this.isValid() ? this.toISOString() : null;
    	    }

    	    function isValid$2() {
    	        return isValid(this);
    	    }

    	    function parsingFlags() {
    	        return extend({}, getParsingFlags(this));
    	    }

    	    function invalidAt() {
    	        return getParsingFlags(this).overflow;
    	    }

    	    function creationData() {
    	        return {
    	            input: this._i,
    	            format: this._f,
    	            locale: this._locale,
    	            isUTC: this._isUTC,
    	            strict: this._strict,
    	        };
    	    }

    	    addFormatToken('N', 0, 0, 'eraAbbr');
    	    addFormatToken('NN', 0, 0, 'eraAbbr');
    	    addFormatToken('NNN', 0, 0, 'eraAbbr');
    	    addFormatToken('NNNN', 0, 0, 'eraName');
    	    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

    	    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
    	    addFormatToken('y', ['yy', 2], 0, 'eraYear');
    	    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
    	    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

    	    addRegexToken('N', matchEraAbbr);
    	    addRegexToken('NN', matchEraAbbr);
    	    addRegexToken('NNN', matchEraAbbr);
    	    addRegexToken('NNNN', matchEraName);
    	    addRegexToken('NNNNN', matchEraNarrow);

    	    addParseToken(
    	        ['N', 'NN', 'NNN', 'NNNN', 'NNNNN'],
    	        function (input, array, config, token) {
    	            var era = config._locale.erasParse(input, token, config._strict);
    	            if (era) {
    	                getParsingFlags(config).era = era;
    	            } else {
    	                getParsingFlags(config).invalidEra = input;
    	            }
    	        }
    	    );

    	    addRegexToken('y', matchUnsigned);
    	    addRegexToken('yy', matchUnsigned);
    	    addRegexToken('yyy', matchUnsigned);
    	    addRegexToken('yyyy', matchUnsigned);
    	    addRegexToken('yo', matchEraYearOrdinal);

    	    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
    	    addParseToken(['yo'], function (input, array, config, token) {
    	        var match;
    	        if (config._locale._eraYearOrdinalRegex) {
    	            match = input.match(config._locale._eraYearOrdinalRegex);
    	        }

    	        if (config._locale.eraYearOrdinalParse) {
    	            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
    	        } else {
    	            array[YEAR] = parseInt(input, 10);
    	        }
    	    });

    	    function localeEras(m, format) {
    	        var i,
    	            l,
    	            date,
    	            eras = this._eras || getLocale('en')._eras;
    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            switch (typeof eras[i].since) {
    	                case 'string':
    	                    // truncate time
    	                    date = hooks(eras[i].since).startOf('day');
    	                    eras[i].since = date.valueOf();
    	                    break;
    	            }

    	            switch (typeof eras[i].until) {
    	                case 'undefined':
    	                    eras[i].until = +Infinity;
    	                    break;
    	                case 'string':
    	                    // truncate time
    	                    date = hooks(eras[i].until).startOf('day').valueOf();
    	                    eras[i].until = date.valueOf();
    	                    break;
    	            }
    	        }
    	        return eras;
    	    }

    	    function localeErasParse(eraName, format, strict) {
    	        var i,
    	            l,
    	            eras = this.eras(),
    	            name,
    	            abbr,
    	            narrow;
    	        eraName = eraName.toUpperCase();

    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            name = eras[i].name.toUpperCase();
    	            abbr = eras[i].abbr.toUpperCase();
    	            narrow = eras[i].narrow.toUpperCase();

    	            if (strict) {
    	                switch (format) {
    	                    case 'N':
    	                    case 'NN':
    	                    case 'NNN':
    	                        if (abbr === eraName) {
    	                            return eras[i];
    	                        }
    	                        break;

    	                    case 'NNNN':
    	                        if (name === eraName) {
    	                            return eras[i];
    	                        }
    	                        break;

    	                    case 'NNNNN':
    	                        if (narrow === eraName) {
    	                            return eras[i];
    	                        }
    	                        break;
    	                }
    	            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
    	                return eras[i];
    	            }
    	        }
    	    }

    	    function localeErasConvertYear(era, year) {
    	        var dir = era.since <= era.until ? +1 : -1;
    	        if (year === undefined) {
    	            return hooks(era.since).year();
    	        } else {
    	            return hooks(era.since).year() + (year - era.offset) * dir;
    	        }
    	    }

    	    function getEraName() {
    	        var i,
    	            l,
    	            val,
    	            eras = this.localeData().eras();
    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            // truncate time
    	            val = this.clone().startOf('day').valueOf();

    	            if (eras[i].since <= val && val <= eras[i].until) {
    	                return eras[i].name;
    	            }
    	            if (eras[i].until <= val && val <= eras[i].since) {
    	                return eras[i].name;
    	            }
    	        }

    	        return '';
    	    }

    	    function getEraNarrow() {
    	        var i,
    	            l,
    	            val,
    	            eras = this.localeData().eras();
    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            // truncate time
    	            val = this.clone().startOf('day').valueOf();

    	            if (eras[i].since <= val && val <= eras[i].until) {
    	                return eras[i].narrow;
    	            }
    	            if (eras[i].until <= val && val <= eras[i].since) {
    	                return eras[i].narrow;
    	            }
    	        }

    	        return '';
    	    }

    	    function getEraAbbr() {
    	        var i,
    	            l,
    	            val,
    	            eras = this.localeData().eras();
    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            // truncate time
    	            val = this.clone().startOf('day').valueOf();

    	            if (eras[i].since <= val && val <= eras[i].until) {
    	                return eras[i].abbr;
    	            }
    	            if (eras[i].until <= val && val <= eras[i].since) {
    	                return eras[i].abbr;
    	            }
    	        }

    	        return '';
    	    }

    	    function getEraYear() {
    	        var i,
    	            l,
    	            dir,
    	            val,
    	            eras = this.localeData().eras();
    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            dir = eras[i].since <= eras[i].until ? +1 : -1;

    	            // truncate time
    	            val = this.clone().startOf('day').valueOf();

    	            if (
    	                (eras[i].since <= val && val <= eras[i].until) ||
    	                (eras[i].until <= val && val <= eras[i].since)
    	            ) {
    	                return (
    	                    (this.year() - hooks(eras[i].since).year()) * dir +
    	                    eras[i].offset
    	                );
    	            }
    	        }

    	        return this.year();
    	    }

    	    function erasNameRegex(isStrict) {
    	        if (!hasOwnProp(this, '_erasNameRegex')) {
    	            computeErasParse.call(this);
    	        }
    	        return isStrict ? this._erasNameRegex : this._erasRegex;
    	    }

    	    function erasAbbrRegex(isStrict) {
    	        if (!hasOwnProp(this, '_erasAbbrRegex')) {
    	            computeErasParse.call(this);
    	        }
    	        return isStrict ? this._erasAbbrRegex : this._erasRegex;
    	    }

    	    function erasNarrowRegex(isStrict) {
    	        if (!hasOwnProp(this, '_erasNarrowRegex')) {
    	            computeErasParse.call(this);
    	        }
    	        return isStrict ? this._erasNarrowRegex : this._erasRegex;
    	    }

    	    function matchEraAbbr(isStrict, locale) {
    	        return locale.erasAbbrRegex(isStrict);
    	    }

    	    function matchEraName(isStrict, locale) {
    	        return locale.erasNameRegex(isStrict);
    	    }

    	    function matchEraNarrow(isStrict, locale) {
    	        return locale.erasNarrowRegex(isStrict);
    	    }

    	    function matchEraYearOrdinal(isStrict, locale) {
    	        return locale._eraYearOrdinalRegex || matchUnsigned;
    	    }

    	    function computeErasParse() {
    	        var abbrPieces = [],
    	            namePieces = [],
    	            narrowPieces = [],
    	            mixedPieces = [],
    	            i,
    	            l,
    	            eras = this.eras();

    	        for (i = 0, l = eras.length; i < l; ++i) {
    	            namePieces.push(regexEscape(eras[i].name));
    	            abbrPieces.push(regexEscape(eras[i].abbr));
    	            narrowPieces.push(regexEscape(eras[i].narrow));

    	            mixedPieces.push(regexEscape(eras[i].name));
    	            mixedPieces.push(regexEscape(eras[i].abbr));
    	            mixedPieces.push(regexEscape(eras[i].narrow));
    	        }

    	        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    	        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
    	        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
    	        this._erasNarrowRegex = new RegExp(
    	            '^(' + narrowPieces.join('|') + ')',
    	            'i'
    	        );
    	    }

    	    // FORMATTING

    	    addFormatToken(0, ['gg', 2], 0, function () {
    	        return this.weekYear() % 100;
    	    });

    	    addFormatToken(0, ['GG', 2], 0, function () {
    	        return this.isoWeekYear() % 100;
    	    });

    	    function addWeekYearFormatToken(token, getter) {
    	        addFormatToken(0, [token, token.length], 0, getter);
    	    }

    	    addWeekYearFormatToken('gggg', 'weekYear');
    	    addWeekYearFormatToken('ggggg', 'weekYear');
    	    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    	    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    	    // ALIASES

    	    addUnitAlias('weekYear', 'gg');
    	    addUnitAlias('isoWeekYear', 'GG');

    	    // PRIORITY

    	    addUnitPriority('weekYear', 1);
    	    addUnitPriority('isoWeekYear', 1);

    	    // PARSING

    	    addRegexToken('G', matchSigned);
    	    addRegexToken('g', matchSigned);
    	    addRegexToken('GG', match1to2, match2);
    	    addRegexToken('gg', match1to2, match2);
    	    addRegexToken('GGGG', match1to4, match4);
    	    addRegexToken('gggg', match1to4, match4);
    	    addRegexToken('GGGGG', match1to6, match6);
    	    addRegexToken('ggggg', match1to6, match6);

    	    addWeekParseToken(
    	        ['gggg', 'ggggg', 'GGGG', 'GGGGG'],
    	        function (input, week, config, token) {
    	            week[token.substr(0, 2)] = toInt(input);
    	        }
    	    );

    	    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    	        week[token] = hooks.parseTwoDigitYear(input);
    	    });

    	    // MOMENTS

    	    function getSetWeekYear(input) {
    	        return getSetWeekYearHelper.call(
    	            this,
    	            input,
    	            this.week(),
    	            this.weekday(),
    	            this.localeData()._week.dow,
    	            this.localeData()._week.doy
    	        );
    	    }

    	    function getSetISOWeekYear(input) {
    	        return getSetWeekYearHelper.call(
    	            this,
    	            input,
    	            this.isoWeek(),
    	            this.isoWeekday(),
    	            1,
    	            4
    	        );
    	    }

    	    function getISOWeeksInYear() {
    	        return weeksInYear(this.year(), 1, 4);
    	    }

    	    function getISOWeeksInISOWeekYear() {
    	        return weeksInYear(this.isoWeekYear(), 1, 4);
    	    }

    	    function getWeeksInYear() {
    	        var weekInfo = this.localeData()._week;
    	        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    	    }

    	    function getWeeksInWeekYear() {
    	        var weekInfo = this.localeData()._week;
    	        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    	    }

    	    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    	        var weeksTarget;
    	        if (input == null) {
    	            return weekOfYear(this, dow, doy).year;
    	        } else {
    	            weeksTarget = weeksInYear(input, dow, doy);
    	            if (week > weeksTarget) {
    	                week = weeksTarget;
    	            }
    	            return setWeekAll.call(this, input, week, weekday, dow, doy);
    	        }
    	    }

    	    function setWeekAll(weekYear, week, weekday, dow, doy) {
    	        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
    	            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    	        this.year(date.getUTCFullYear());
    	        this.month(date.getUTCMonth());
    	        this.date(date.getUTCDate());
    	        return this;
    	    }

    	    // FORMATTING

    	    addFormatToken('Q', 0, 'Qo', 'quarter');

    	    // ALIASES

    	    addUnitAlias('quarter', 'Q');

    	    // PRIORITY

    	    addUnitPriority('quarter', 7);

    	    // PARSING

    	    addRegexToken('Q', match1);
    	    addParseToken('Q', function (input, array) {
    	        array[MONTH] = (toInt(input) - 1) * 3;
    	    });

    	    // MOMENTS

    	    function getSetQuarter(input) {
    	        return input == null
    	            ? Math.ceil((this.month() + 1) / 3)
    	            : this.month((input - 1) * 3 + (this.month() % 3));
    	    }

    	    // FORMATTING

    	    addFormatToken('D', ['DD', 2], 'Do', 'date');

    	    // ALIASES

    	    addUnitAlias('date', 'D');

    	    // PRIORITY
    	    addUnitPriority('date', 9);

    	    // PARSING

    	    addRegexToken('D', match1to2);
    	    addRegexToken('DD', match1to2, match2);
    	    addRegexToken('Do', function (isStrict, locale) {
    	        // TODO: Remove "ordinalParse" fallback in next major release.
    	        return isStrict
    	            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
    	            : locale._dayOfMonthOrdinalParseLenient;
    	    });

    	    addParseToken(['D', 'DD'], DATE);
    	    addParseToken('Do', function (input, array) {
    	        array[DATE] = toInt(input.match(match1to2)[0]);
    	    });

    	    // MOMENTS

    	    var getSetDayOfMonth = makeGetSet('Date', true);

    	    // FORMATTING

    	    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    	    // ALIASES

    	    addUnitAlias('dayOfYear', 'DDD');

    	    // PRIORITY
    	    addUnitPriority('dayOfYear', 4);

    	    // PARSING

    	    addRegexToken('DDD', match1to3);
    	    addRegexToken('DDDD', match3);
    	    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    	        config._dayOfYear = toInt(input);
    	    });

    	    // HELPERS

    	    // MOMENTS

    	    function getSetDayOfYear(input) {
    	        var dayOfYear =
    	            Math.round(
    	                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
    	            ) + 1;
    	        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    	    }

    	    // FORMATTING

    	    addFormatToken('m', ['mm', 2], 0, 'minute');

    	    // ALIASES

    	    addUnitAlias('minute', 'm');

    	    // PRIORITY

    	    addUnitPriority('minute', 14);

    	    // PARSING

    	    addRegexToken('m', match1to2);
    	    addRegexToken('mm', match1to2, match2);
    	    addParseToken(['m', 'mm'], MINUTE);

    	    // MOMENTS

    	    var getSetMinute = makeGetSet('Minutes', false);

    	    // FORMATTING

    	    addFormatToken('s', ['ss', 2], 0, 'second');

    	    // ALIASES

    	    addUnitAlias('second', 's');

    	    // PRIORITY

    	    addUnitPriority('second', 15);

    	    // PARSING

    	    addRegexToken('s', match1to2);
    	    addRegexToken('ss', match1to2, match2);
    	    addParseToken(['s', 'ss'], SECOND);

    	    // MOMENTS

    	    var getSetSecond = makeGetSet('Seconds', false);

    	    // FORMATTING

    	    addFormatToken('S', 0, 0, function () {
    	        return ~~(this.millisecond() / 100);
    	    });

    	    addFormatToken(0, ['SS', 2], 0, function () {
    	        return ~~(this.millisecond() / 10);
    	    });

    	    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    	    addFormatToken(0, ['SSSS', 4], 0, function () {
    	        return this.millisecond() * 10;
    	    });
    	    addFormatToken(0, ['SSSSS', 5], 0, function () {
    	        return this.millisecond() * 100;
    	    });
    	    addFormatToken(0, ['SSSSSS', 6], 0, function () {
    	        return this.millisecond() * 1000;
    	    });
    	    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    	        return this.millisecond() * 10000;
    	    });
    	    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    	        return this.millisecond() * 100000;
    	    });
    	    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    	        return this.millisecond() * 1000000;
    	    });

    	    // ALIASES

    	    addUnitAlias('millisecond', 'ms');

    	    // PRIORITY

    	    addUnitPriority('millisecond', 16);

    	    // PARSING

    	    addRegexToken('S', match1to3, match1);
    	    addRegexToken('SS', match1to3, match2);
    	    addRegexToken('SSS', match1to3, match3);

    	    var token, getSetMillisecond;
    	    for (token = 'SSSS'; token.length <= 9; token += 'S') {
    	        addRegexToken(token, matchUnsigned);
    	    }

    	    function parseMs(input, array) {
    	        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    	    }

    	    for (token = 'S'; token.length <= 9; token += 'S') {
    	        addParseToken(token, parseMs);
    	    }

    	    getSetMillisecond = makeGetSet('Milliseconds', false);

    	    // FORMATTING

    	    addFormatToken('z', 0, 0, 'zoneAbbr');
    	    addFormatToken('zz', 0, 0, 'zoneName');

    	    // MOMENTS

    	    function getZoneAbbr() {
    	        return this._isUTC ? 'UTC' : '';
    	    }

    	    function getZoneName() {
    	        return this._isUTC ? 'Coordinated Universal Time' : '';
    	    }

    	    var proto = Moment.prototype;

    	    proto.add = add;
    	    proto.calendar = calendar$1;
    	    proto.clone = clone;
    	    proto.diff = diff;
    	    proto.endOf = endOf;
    	    proto.format = format;
    	    proto.from = from;
    	    proto.fromNow = fromNow;
    	    proto.to = to;
    	    proto.toNow = toNow;
    	    proto.get = stringGet;
    	    proto.invalidAt = invalidAt;
    	    proto.isAfter = isAfter;
    	    proto.isBefore = isBefore;
    	    proto.isBetween = isBetween;
    	    proto.isSame = isSame;
    	    proto.isSameOrAfter = isSameOrAfter;
    	    proto.isSameOrBefore = isSameOrBefore;
    	    proto.isValid = isValid$2;
    	    proto.lang = lang;
    	    proto.locale = locale;
    	    proto.localeData = localeData;
    	    proto.max = prototypeMax;
    	    proto.min = prototypeMin;
    	    proto.parsingFlags = parsingFlags;
    	    proto.set = stringSet;
    	    proto.startOf = startOf;
    	    proto.subtract = subtract;
    	    proto.toArray = toArray;
    	    proto.toObject = toObject;
    	    proto.toDate = toDate;
    	    proto.toISOString = toISOString;
    	    proto.inspect = inspect;
    	    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
    	        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
    	            return 'Moment<' + this.format() + '>';
    	        };
    	    }
    	    proto.toJSON = toJSON;
    	    proto.toString = toString;
    	    proto.unix = unix;
    	    proto.valueOf = valueOf;
    	    proto.creationData = creationData;
    	    proto.eraName = getEraName;
    	    proto.eraNarrow = getEraNarrow;
    	    proto.eraAbbr = getEraAbbr;
    	    proto.eraYear = getEraYear;
    	    proto.year = getSetYear;
    	    proto.isLeapYear = getIsLeapYear;
    	    proto.weekYear = getSetWeekYear;
    	    proto.isoWeekYear = getSetISOWeekYear;
    	    proto.quarter = proto.quarters = getSetQuarter;
    	    proto.month = getSetMonth;
    	    proto.daysInMonth = getDaysInMonth;
    	    proto.week = proto.weeks = getSetWeek;
    	    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    	    proto.weeksInYear = getWeeksInYear;
    	    proto.weeksInWeekYear = getWeeksInWeekYear;
    	    proto.isoWeeksInYear = getISOWeeksInYear;
    	    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
    	    proto.date = getSetDayOfMonth;
    	    proto.day = proto.days = getSetDayOfWeek;
    	    proto.weekday = getSetLocaleDayOfWeek;
    	    proto.isoWeekday = getSetISODayOfWeek;
    	    proto.dayOfYear = getSetDayOfYear;
    	    proto.hour = proto.hours = getSetHour;
    	    proto.minute = proto.minutes = getSetMinute;
    	    proto.second = proto.seconds = getSetSecond;
    	    proto.millisecond = proto.milliseconds = getSetMillisecond;
    	    proto.utcOffset = getSetOffset;
    	    proto.utc = setOffsetToUTC;
    	    proto.local = setOffsetToLocal;
    	    proto.parseZone = setOffsetToParsedOffset;
    	    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    	    proto.isDST = isDaylightSavingTime;
    	    proto.isLocal = isLocal;
    	    proto.isUtcOffset = isUtcOffset;
    	    proto.isUtc = isUtc;
    	    proto.isUTC = isUtc;
    	    proto.zoneAbbr = getZoneAbbr;
    	    proto.zoneName = getZoneName;
    	    proto.dates = deprecate(
    	        'dates accessor is deprecated. Use date instead.',
    	        getSetDayOfMonth
    	    );
    	    proto.months = deprecate(
    	        'months accessor is deprecated. Use month instead',
    	        getSetMonth
    	    );
    	    proto.years = deprecate(
    	        'years accessor is deprecated. Use year instead',
    	        getSetYear
    	    );
    	    proto.zone = deprecate(
    	        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
    	        getSetZone
    	    );
    	    proto.isDSTShifted = deprecate(
    	        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
    	        isDaylightSavingTimeShifted
    	    );

    	    function createUnix(input) {
    	        return createLocal(input * 1000);
    	    }

    	    function createInZone() {
    	        return createLocal.apply(null, arguments).parseZone();
    	    }

    	    function preParsePostFormat(string) {
    	        return string;
    	    }

    	    var proto$1 = Locale.prototype;

    	    proto$1.calendar = calendar;
    	    proto$1.longDateFormat = longDateFormat;
    	    proto$1.invalidDate = invalidDate;
    	    proto$1.ordinal = ordinal;
    	    proto$1.preparse = preParsePostFormat;
    	    proto$1.postformat = preParsePostFormat;
    	    proto$1.relativeTime = relativeTime;
    	    proto$1.pastFuture = pastFuture;
    	    proto$1.set = set;
    	    proto$1.eras = localeEras;
    	    proto$1.erasParse = localeErasParse;
    	    proto$1.erasConvertYear = localeErasConvertYear;
    	    proto$1.erasAbbrRegex = erasAbbrRegex;
    	    proto$1.erasNameRegex = erasNameRegex;
    	    proto$1.erasNarrowRegex = erasNarrowRegex;

    	    proto$1.months = localeMonths;
    	    proto$1.monthsShort = localeMonthsShort;
    	    proto$1.monthsParse = localeMonthsParse;
    	    proto$1.monthsRegex = monthsRegex;
    	    proto$1.monthsShortRegex = monthsShortRegex;
    	    proto$1.week = localeWeek;
    	    proto$1.firstDayOfYear = localeFirstDayOfYear;
    	    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    	    proto$1.weekdays = localeWeekdays;
    	    proto$1.weekdaysMin = localeWeekdaysMin;
    	    proto$1.weekdaysShort = localeWeekdaysShort;
    	    proto$1.weekdaysParse = localeWeekdaysParse;

    	    proto$1.weekdaysRegex = weekdaysRegex;
    	    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    	    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    	    proto$1.isPM = localeIsPM;
    	    proto$1.meridiem = localeMeridiem;

    	    function get$1(format, index, field, setter) {
    	        var locale = getLocale(),
    	            utc = createUTC().set(setter, index);
    	        return locale[field](utc, format);
    	    }

    	    function listMonthsImpl(format, index, field) {
    	        if (isNumber(format)) {
    	            index = format;
    	            format = undefined;
    	        }

    	        format = format || '';

    	        if (index != null) {
    	            return get$1(format, index, field, 'month');
    	        }

    	        var i,
    	            out = [];
    	        for (i = 0; i < 12; i++) {
    	            out[i] = get$1(format, i, field, 'month');
    	        }
    	        return out;
    	    }

    	    // ()
    	    // (5)
    	    // (fmt, 5)
    	    // (fmt)
    	    // (true)
    	    // (true, 5)
    	    // (true, fmt, 5)
    	    // (true, fmt)
    	    function listWeekdaysImpl(localeSorted, format, index, field) {
    	        if (typeof localeSorted === 'boolean') {
    	            if (isNumber(format)) {
    	                index = format;
    	                format = undefined;
    	            }

    	            format = format || '';
    	        } else {
    	            format = localeSorted;
    	            index = format;
    	            localeSorted = false;

    	            if (isNumber(format)) {
    	                index = format;
    	                format = undefined;
    	            }

    	            format = format || '';
    	        }

    	        var locale = getLocale(),
    	            shift = localeSorted ? locale._week.dow : 0,
    	            i,
    	            out = [];

    	        if (index != null) {
    	            return get$1(format, (index + shift) % 7, field, 'day');
    	        }

    	        for (i = 0; i < 7; i++) {
    	            out[i] = get$1(format, (i + shift) % 7, field, 'day');
    	        }
    	        return out;
    	    }

    	    function listMonths(format, index) {
    	        return listMonthsImpl(format, index, 'months');
    	    }

    	    function listMonthsShort(format, index) {
    	        return listMonthsImpl(format, index, 'monthsShort');
    	    }

    	    function listWeekdays(localeSorted, format, index) {
    	        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    	    }

    	    function listWeekdaysShort(localeSorted, format, index) {
    	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    	    }

    	    function listWeekdaysMin(localeSorted, format, index) {
    	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    	    }

    	    getSetGlobalLocale('en', {
    	        eras: [
    	            {
    	                since: '0001-01-01',
    	                until: +Infinity,
    	                offset: 1,
    	                name: 'Anno Domini',
    	                narrow: 'AD',
    	                abbr: 'AD',
    	            },
    	            {
    	                since: '0000-12-31',
    	                until: -Infinity,
    	                offset: 1,
    	                name: 'Before Christ',
    	                narrow: 'BC',
    	                abbr: 'BC',
    	            },
    	        ],
    	        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    	        ordinal: function (number) {
    	            var b = number % 10,
    	                output =
    	                    toInt((number % 100) / 10) === 1
    	                        ? 'th'
    	                        : b === 1
    	                        ? 'st'
    	                        : b === 2
    	                        ? 'nd'
    	                        : b === 3
    	                        ? 'rd'
    	                        : 'th';
    	            return number + output;
    	        },
    	    });

    	    // Side effect imports

    	    hooks.lang = deprecate(
    	        'moment.lang is deprecated. Use moment.locale instead.',
    	        getSetGlobalLocale
    	    );
    	    hooks.langData = deprecate(
    	        'moment.langData is deprecated. Use moment.localeData instead.',
    	        getLocale
    	    );

    	    var mathAbs = Math.abs;

    	    function abs() {
    	        var data = this._data;

    	        this._milliseconds = mathAbs(this._milliseconds);
    	        this._days = mathAbs(this._days);
    	        this._months = mathAbs(this._months);

    	        data.milliseconds = mathAbs(data.milliseconds);
    	        data.seconds = mathAbs(data.seconds);
    	        data.minutes = mathAbs(data.minutes);
    	        data.hours = mathAbs(data.hours);
    	        data.months = mathAbs(data.months);
    	        data.years = mathAbs(data.years);

    	        return this;
    	    }

    	    function addSubtract$1(duration, input, value, direction) {
    	        var other = createDuration(input, value);

    	        duration._milliseconds += direction * other._milliseconds;
    	        duration._days += direction * other._days;
    	        duration._months += direction * other._months;

    	        return duration._bubble();
    	    }

    	    // supports only 2.0-style add(1, 's') or add(duration)
    	    function add$1(input, value) {
    	        return addSubtract$1(this, input, value, 1);
    	    }

    	    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    	    function subtract$1(input, value) {
    	        return addSubtract$1(this, input, value, -1);
    	    }

    	    function absCeil(number) {
    	        if (number < 0) {
    	            return Math.floor(number);
    	        } else {
    	            return Math.ceil(number);
    	        }
    	    }

    	    function bubble() {
    	        var milliseconds = this._milliseconds,
    	            days = this._days,
    	            months = this._months,
    	            data = this._data,
    	            seconds,
    	            minutes,
    	            hours,
    	            years,
    	            monthsFromDays;

    	        // if we have a mix of positive and negative values, bubble down first
    	        // check: https://github.com/moment/moment/issues/2166
    	        if (
    	            !(
    	                (milliseconds >= 0 && days >= 0 && months >= 0) ||
    	                (milliseconds <= 0 && days <= 0 && months <= 0)
    	            )
    	        ) {
    	            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
    	            days = 0;
    	            months = 0;
    	        }

    	        // The following code bubbles up values, see the tests for
    	        // examples of what that means.
    	        data.milliseconds = milliseconds % 1000;

    	        seconds = absFloor(milliseconds / 1000);
    	        data.seconds = seconds % 60;

    	        minutes = absFloor(seconds / 60);
    	        data.minutes = minutes % 60;

    	        hours = absFloor(minutes / 60);
    	        data.hours = hours % 24;

    	        days += absFloor(hours / 24);

    	        // convert days to months
    	        monthsFromDays = absFloor(daysToMonths(days));
    	        months += monthsFromDays;
    	        days -= absCeil(monthsToDays(monthsFromDays));

    	        // 12 months -> 1 year
    	        years = absFloor(months / 12);
    	        months %= 12;

    	        data.days = days;
    	        data.months = months;
    	        data.years = years;

    	        return this;
    	    }

    	    function daysToMonths(days) {
    	        // 400 years have 146097 days (taking into account leap year rules)
    	        // 400 years have 12 months === 4800
    	        return (days * 4800) / 146097;
    	    }

    	    function monthsToDays(months) {
    	        // the reverse of daysToMonths
    	        return (months * 146097) / 4800;
    	    }

    	    function as(units) {
    	        if (!this.isValid()) {
    	            return NaN;
    	        }
    	        var days,
    	            months,
    	            milliseconds = this._milliseconds;

    	        units = normalizeUnits(units);

    	        if (units === 'month' || units === 'quarter' || units === 'year') {
    	            days = this._days + milliseconds / 864e5;
    	            months = this._months + daysToMonths(days);
    	            switch (units) {
    	                case 'month':
    	                    return months;
    	                case 'quarter':
    	                    return months / 3;
    	                case 'year':
    	                    return months / 12;
    	            }
    	        } else {
    	            // handle milliseconds separately because of floating point math errors (issue #1867)
    	            days = this._days + Math.round(monthsToDays(this._months));
    	            switch (units) {
    	                case 'week':
    	                    return days / 7 + milliseconds / 6048e5;
    	                case 'day':
    	                    return days + milliseconds / 864e5;
    	                case 'hour':
    	                    return days * 24 + milliseconds / 36e5;
    	                case 'minute':
    	                    return days * 1440 + milliseconds / 6e4;
    	                case 'second':
    	                    return days * 86400 + milliseconds / 1000;
    	                // Math.floor prevents floating point math errors here
    	                case 'millisecond':
    	                    return Math.floor(days * 864e5) + milliseconds;
    	                default:
    	                    throw new Error('Unknown unit ' + units);
    	            }
    	        }
    	    }

    	    // TODO: Use this.as('ms')?
    	    function valueOf$1() {
    	        if (!this.isValid()) {
    	            return NaN;
    	        }
    	        return (
    	            this._milliseconds +
    	            this._days * 864e5 +
    	            (this._months % 12) * 2592e6 +
    	            toInt(this._months / 12) * 31536e6
    	        );
    	    }

    	    function makeAs(alias) {
    	        return function () {
    	            return this.as(alias);
    	        };
    	    }

    	    var asMilliseconds = makeAs('ms'),
    	        asSeconds = makeAs('s'),
    	        asMinutes = makeAs('m'),
    	        asHours = makeAs('h'),
    	        asDays = makeAs('d'),
    	        asWeeks = makeAs('w'),
    	        asMonths = makeAs('M'),
    	        asQuarters = makeAs('Q'),
    	        asYears = makeAs('y');

    	    function clone$1() {
    	        return createDuration(this);
    	    }

    	    function get$2(units) {
    	        units = normalizeUnits(units);
    	        return this.isValid() ? this[units + 's']() : NaN;
    	    }

    	    function makeGetter(name) {
    	        return function () {
    	            return this.isValid() ? this._data[name] : NaN;
    	        };
    	    }

    	    var milliseconds = makeGetter('milliseconds'),
    	        seconds = makeGetter('seconds'),
    	        minutes = makeGetter('minutes'),
    	        hours = makeGetter('hours'),
    	        days = makeGetter('days'),
    	        months = makeGetter('months'),
    	        years = makeGetter('years');

    	    function weeks() {
    	        return absFloor(this.days() / 7);
    	    }

    	    var round = Math.round,
    	        thresholds = {
    	            ss: 44, // a few seconds to seconds
    	            s: 45, // seconds to minute
    	            m: 45, // minutes to hour
    	            h: 22, // hours to day
    	            d: 26, // days to month/week
    	            w: null, // weeks to month
    	            M: 11, // months to year
    	        };

    	    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    	    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    	        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    	    }

    	    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
    	        var duration = createDuration(posNegDuration).abs(),
    	            seconds = round(duration.as('s')),
    	            minutes = round(duration.as('m')),
    	            hours = round(duration.as('h')),
    	            days = round(duration.as('d')),
    	            months = round(duration.as('M')),
    	            weeks = round(duration.as('w')),
    	            years = round(duration.as('y')),
    	            a =
    	                (seconds <= thresholds.ss && ['s', seconds]) ||
    	                (seconds < thresholds.s && ['ss', seconds]) ||
    	                (minutes <= 1 && ['m']) ||
    	                (minutes < thresholds.m && ['mm', minutes]) ||
    	                (hours <= 1 && ['h']) ||
    	                (hours < thresholds.h && ['hh', hours]) ||
    	                (days <= 1 && ['d']) ||
    	                (days < thresholds.d && ['dd', days]);

    	        if (thresholds.w != null) {
    	            a =
    	                a ||
    	                (weeks <= 1 && ['w']) ||
    	                (weeks < thresholds.w && ['ww', weeks]);
    	        }
    	        a = a ||
    	            (months <= 1 && ['M']) ||
    	            (months < thresholds.M && ['MM', months]) ||
    	            (years <= 1 && ['y']) || ['yy', years];

    	        a[2] = withoutSuffix;
    	        a[3] = +posNegDuration > 0;
    	        a[4] = locale;
    	        return substituteTimeAgo.apply(null, a);
    	    }

    	    // This function allows you to set the rounding function for relative time strings
    	    function getSetRelativeTimeRounding(roundingFunction) {
    	        if (roundingFunction === undefined) {
    	            return round;
    	        }
    	        if (typeof roundingFunction === 'function') {
    	            round = roundingFunction;
    	            return true;
    	        }
    	        return false;
    	    }

    	    // This function allows you to set a threshold for relative time strings
    	    function getSetRelativeTimeThreshold(threshold, limit) {
    	        if (thresholds[threshold] === undefined) {
    	            return false;
    	        }
    	        if (limit === undefined) {
    	            return thresholds[threshold];
    	        }
    	        thresholds[threshold] = limit;
    	        if (threshold === 's') {
    	            thresholds.ss = limit - 1;
    	        }
    	        return true;
    	    }

    	    function humanize(argWithSuffix, argThresholds) {
    	        if (!this.isValid()) {
    	            return this.localeData().invalidDate();
    	        }

    	        var withSuffix = false,
    	            th = thresholds,
    	            locale,
    	            output;

    	        if (typeof argWithSuffix === 'object') {
    	            argThresholds = argWithSuffix;
    	            argWithSuffix = false;
    	        }
    	        if (typeof argWithSuffix === 'boolean') {
    	            withSuffix = argWithSuffix;
    	        }
    	        if (typeof argThresholds === 'object') {
    	            th = Object.assign({}, thresholds, argThresholds);
    	            if (argThresholds.s != null && argThresholds.ss == null) {
    	                th.ss = argThresholds.s - 1;
    	            }
    	        }

    	        locale = this.localeData();
    	        output = relativeTime$1(this, !withSuffix, th, locale);

    	        if (withSuffix) {
    	            output = locale.pastFuture(+this, output);
    	        }

    	        return locale.postformat(output);
    	    }

    	    var abs$1 = Math.abs;

    	    function sign(x) {
    	        return (x > 0) - (x < 0) || +x;
    	    }

    	    function toISOString$1() {
    	        // for ISO strings we do not use the normal bubbling rules:
    	        //  * milliseconds bubble up until they become hours
    	        //  * days do not bubble at all
    	        //  * months bubble up until they become years
    	        // This is because there is no context-free conversion between hours and days
    	        // (think of clock changes)
    	        // and also not between days and months (28-31 days per month)
    	        if (!this.isValid()) {
    	            return this.localeData().invalidDate();
    	        }

    	        var seconds = abs$1(this._milliseconds) / 1000,
    	            days = abs$1(this._days),
    	            months = abs$1(this._months),
    	            minutes,
    	            hours,
    	            years,
    	            s,
    	            total = this.asSeconds(),
    	            totalSign,
    	            ymSign,
    	            daysSign,
    	            hmsSign;

    	        if (!total) {
    	            // this is the same as C#'s (Noda) and python (isodate)...
    	            // but not other JS (goog.date)
    	            return 'P0D';
    	        }

    	        // 3600 seconds -> 60 minutes -> 1 hour
    	        minutes = absFloor(seconds / 60);
    	        hours = absFloor(minutes / 60);
    	        seconds %= 60;
    	        minutes %= 60;

    	        // 12 months -> 1 year
    	        years = absFloor(months / 12);
    	        months %= 12;

    	        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    	        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

    	        totalSign = total < 0 ? '-' : '';
    	        ymSign = sign(this._months) !== sign(total) ? '-' : '';
    	        daysSign = sign(this._days) !== sign(total) ? '-' : '';
    	        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

    	        return (
    	            totalSign +
    	            'P' +
    	            (years ? ymSign + years + 'Y' : '') +
    	            (months ? ymSign + months + 'M' : '') +
    	            (days ? daysSign + days + 'D' : '') +
    	            (hours || minutes || seconds ? 'T' : '') +
    	            (hours ? hmsSign + hours + 'H' : '') +
    	            (minutes ? hmsSign + minutes + 'M' : '') +
    	            (seconds ? hmsSign + s + 'S' : '')
    	        );
    	    }

    	    var proto$2 = Duration.prototype;

    	    proto$2.isValid = isValid$1;
    	    proto$2.abs = abs;
    	    proto$2.add = add$1;
    	    proto$2.subtract = subtract$1;
    	    proto$2.as = as;
    	    proto$2.asMilliseconds = asMilliseconds;
    	    proto$2.asSeconds = asSeconds;
    	    proto$2.asMinutes = asMinutes;
    	    proto$2.asHours = asHours;
    	    proto$2.asDays = asDays;
    	    proto$2.asWeeks = asWeeks;
    	    proto$2.asMonths = asMonths;
    	    proto$2.asQuarters = asQuarters;
    	    proto$2.asYears = asYears;
    	    proto$2.valueOf = valueOf$1;
    	    proto$2._bubble = bubble;
    	    proto$2.clone = clone$1;
    	    proto$2.get = get$2;
    	    proto$2.milliseconds = milliseconds;
    	    proto$2.seconds = seconds;
    	    proto$2.minutes = minutes;
    	    proto$2.hours = hours;
    	    proto$2.days = days;
    	    proto$2.weeks = weeks;
    	    proto$2.months = months;
    	    proto$2.years = years;
    	    proto$2.humanize = humanize;
    	    proto$2.toISOString = toISOString$1;
    	    proto$2.toString = toISOString$1;
    	    proto$2.toJSON = toISOString$1;
    	    proto$2.locale = locale;
    	    proto$2.localeData = localeData;

    	    proto$2.toIsoString = deprecate(
    	        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
    	        toISOString$1
    	    );
    	    proto$2.lang = lang;

    	    // FORMATTING

    	    addFormatToken('X', 0, 0, 'unix');
    	    addFormatToken('x', 0, 0, 'valueOf');

    	    // PARSING

    	    addRegexToken('x', matchSigned);
    	    addRegexToken('X', matchTimestamp);
    	    addParseToken('X', function (input, array, config) {
    	        config._d = new Date(parseFloat(input) * 1000);
    	    });
    	    addParseToken('x', function (input, array, config) {
    	        config._d = new Date(toInt(input));
    	    });

    	    //! moment.js

    	    hooks.version = '2.29.4';

    	    setHookCallback(createLocal);

    	    hooks.fn = proto;
    	    hooks.min = min;
    	    hooks.max = max;
    	    hooks.now = now;
    	    hooks.utc = createUTC;
    	    hooks.unix = createUnix;
    	    hooks.months = listMonths;
    	    hooks.isDate = isDate;
    	    hooks.locale = getSetGlobalLocale;
    	    hooks.invalid = createInvalid;
    	    hooks.duration = createDuration;
    	    hooks.isMoment = isMoment;
    	    hooks.weekdays = listWeekdays;
    	    hooks.parseZone = createInZone;
    	    hooks.localeData = getLocale;
    	    hooks.isDuration = isDuration;
    	    hooks.monthsShort = listMonthsShort;
    	    hooks.weekdaysMin = listWeekdaysMin;
    	    hooks.defineLocale = defineLocale;
    	    hooks.updateLocale = updateLocale;
    	    hooks.locales = listLocales;
    	    hooks.weekdaysShort = listWeekdaysShort;
    	    hooks.normalizeUnits = normalizeUnits;
    	    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    	    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    	    hooks.calendarFormat = getCalendarFormat;
    	    hooks.prototype = proto;

    	    // currently HTML5 input type only supports 24-hour formats
    	    hooks.HTML5_FMT = {
    	        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
    	        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
    	        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
    	        DATE: 'YYYY-MM-DD', // <input type="date" />
    	        TIME: 'HH:mm', // <input type="time" />
    	        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
    	        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
    	        WEEK: 'GGGG-[W]WW', // <input type="week" />
    	        MONTH: 'YYYY-MM', // <input type="month" />
    	    };

    	    return hooks;

    	})));
    } (moment$1));

    var moment = momentExports;

    /* src\Guesses.svelte generated by Svelte v3.47.0 */

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (70:0) {:else}
    function create_else_block$5(ctx) {
    	let div;
    	let each_value = Array(/*guessCount*/ ctx[3]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "p-3 flex-col items-evenly");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*userGuesses, guessCount*/ 9) {
    				each_value = Array(/*guessCount*/ ctx[3]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (12:0) {#if todaysGame.hasFinished}
    function create_if_block$6(ctx) {
    	let div4;
    	let a;
    	let div3;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let a_href_value;
    	let a_title_value;
    	let if_block0 = /*currentHeardle*/ ctx[1].img && create_if_block_2$4(ctx);
    	let if_block1 = /*currentHeardle*/ ctx[1].artist && create_if_block_1$4(ctx);

    	return {
    		c() {
    			div4 = element("div");
    			a = element("a");
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div1 = element("div");
    			div1.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="14"><defs><linearGradient id="logo_hover_20" x1="0%" y1="0%" x2="0%" y2="100%" spreadMethod="pad"><stop offset="0%" stop-color="#ff7700" stop-opacity="1"></stop><stop offset="100%" stop-color="#ff3300" stop-opacity="1"></stop></linearGradient></defs><path class="text-custom-fg" fill="currentColor" d="M10.517 3.742c-.323 0-.49.363-.49.582 0 0-.244 3.591-.244 4.641 0 1.602.15 2.621.15 2.621 0 .222.261.401.584.401.321 0 .519-.179.519-.401 0 0 .398-1.038.398-2.639 0-1.837-.153-4.127-.284-4.592-.112-.395-.313-.613-.633-.613zm-1.996.268c-.323 0-.49.363-.49.582 0 0-.244 3.322-.244 4.372 0 1.602.119 2.621.119 2.621 0 .222.26.401.584.401.321 0 .581-.179.581-.401 0 0 .081-1.007.081-2.608 0-1.837-.206-4.386-.206-4.386 0-.218-.104-.581-.425-.581zm-2.021 1.729c-.324 0-.49.362-.49.582 0 0-.272 1.594-.272 2.644 0 1.602.179 2.559.179 2.559 0 .222.229.463.552.463.321 0 .519-.241.519-.463 0 0 .19-.944.19-2.546 0-1.837-.253-2.657-.253-2.657 0-.22-.104-.582-.425-.582zm-2.046-.358c-.323 0-.49.363-.49.582 0 0-.162 1.92-.162 2.97 0 1.602.069 2.496.069 2.496 0 .222.26.557.584.557.321 0 .581-.304.581-.526 0 0 .143-.936.143-2.538 0-1.837-.206-2.96-.206-2.96 0-.218-.198-.581-.519-.581zm-2.169 1.482c-.272 0-.232.218-.232.218v3.982s-.04.335.232.335c.351 0 .716-.832.716-2.348 0-1.245-.436-2.187-.716-2.187zm18.715-.976c-.289 0-.567.042-.832.116-.417-2.266-2.806-3.989-5.263-3.989-1.127 0-2.095.705-2.931 1.316v8.16s0 .484.5.484h8.526c1.655 0 3-1.55 3-3.155 0-1.607-1.346-2.932-3-2.932zm10.17.857c-1.077-.253-1.368-.389-1.368-.815 0-.3.242-.611.97-.611.621 0 1.106.253 1.542.699l.981-.951c-.641-.669-1.417-1.067-2.474-1.067-1.339 0-2.425.757-2.425 1.99 0 1.338.873 1.736 2.124 2.026 1.281.291 1.513.486 1.513.923 0 .514-.379.738-1.184.738-.65 0-1.26-.223-1.736-.777l-.98.873c.514.757 1.504 1.232 2.639 1.232 1.853 0 2.668-.873 2.668-2.163 0-1.477-1.193-1.845-2.27-2.097zm6.803-2.745c-1.853 0-2.949 1.435-2.949 3.502s1.096 3.501 2.949 3.501c1.852 0 2.949-1.434 2.949-3.501s-1.096-3.502-2.949-3.502zm0 5.655c-1.097 0-1.553-.941-1.553-2.153 0-1.213.456-2.153 1.553-2.153 1.096 0 1.551.94 1.551 2.153.001 1.213-.454 2.153-1.551 2.153zm8.939-1.736c0 1.086-.533 1.756-1.396 1.756-.864 0-1.388-.689-1.388-1.775v-3.897h-1.358v3.916c0 1.978 1.106 3.084 2.746 3.084 1.726 0 2.754-1.136 2.754-3.103v-3.897h-1.358v3.916zm8.142-.89l.019 1.485c-.087-.174-.31-.515-.475-.768l-2.703-3.692h-1.362v6.894h1.401v-2.988l-.02-1.484c.088.175.311.514.475.767l2.79 3.705h1.213v-6.894h-1.339v2.975zm5.895-2.923h-2.124v6.791h2.027c1.746 0 3.474-1.01 3.474-3.395 0-2.484-1.437-3.396-3.377-3.396zm-.097 5.472h-.67v-4.152h.719c1.436 0 2.028.688 2.028 2.076 0 1.242-.651 2.076-2.077 2.076zm7.909-4.229c.611 0 1 .271 1.242.737l1.26-.582c-.426-.883-1.202-1.503-2.483-1.503-1.775 0-3.016 1.435-3.016 3.502 0 2.143 1.191 3.501 2.968 3.501 1.232 0 2.047-.572 2.513-1.533l-1.145-.68c-.358.602-.718.864-1.329.864-1.019 0-1.611-.932-1.611-2.153-.001-1.261.583-2.153 1.601-2.153zm5.17-1.192h-1.359v6.791h4.083v-1.338h-2.724v-5.453zm6.396-.157c-1.854 0-2.949 1.435-2.949 3.502s1.095 3.501 2.949 3.501c1.853 0 2.95-1.434 2.95-3.501s-1.097-3.502-2.95-3.502zm0 5.655c-1.097 0-1.553-.941-1.553-2.153 0-1.213.456-2.153 1.553-2.153 1.095 0 1.55.94 1.55 2.153.001 1.213-.454 2.153-1.55 2.153zm8.557-1.736c0 1.086-.532 1.756-1.396 1.756-.864 0-1.388-.689-1.388-1.775v-3.794h-1.358v3.813c0 1.978 1.106 3.084 2.746 3.084 1.726 0 2.755-1.136 2.755-3.103v-3.794h-1.36v3.813zm5.449-3.907h-2.318v6.978h2.211c1.908 0 3.789-1.037 3.789-3.489 0-2.552-1.565-3.489-3.682-3.489zm-.108 5.623h-.729v-4.266h.783c1.565 0 2.21.706 2.21 2.133.001 1.276-.707 2.133-2.264 2.133z"></path></svg>`;
    			t2 = space();
    			div2 = element("div");
    			div2.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>`;
    			attr(div0, "class", "flex-1 mx-3 text-white");
    			attr(div1, "class", "text-center flex justify-center");
    			attr(div3, "class", "p-2 flex items-center rounded-sm");
    			toggle_class(div3, "bg-custom-positive", /*todaysGame*/ ctx[2].gotCorrect);
    			toggle_class(div3, "bg-custom-mg", !/*todaysGame*/ ctx[2].gotCorrect);
    			attr(a, "href", a_href_value = /*currentHeardle*/ ctx[1].url);
    			attr(a, "title", a_title_value = "Listen to " + /*currentHeardle*/ ctx[1].artist + " - " + /*currentHeardle*/ ctx[1].title + " on SoundCloud");
    			attr(a, "class", "no-underline");
    			attr(div4, "class", "p-3 pb-0 flex-col items-evenly");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, a);
    			append(a, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append(div3, t0);
    			append(div3, div0);
    			if (if_block1) if_block1.m(div0, null);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t2);
    			append(div3, div2);
    		},
    		p(ctx, dirty) {
    			if (/*currentHeardle*/ ctx[1].img) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$4(ctx);
    					if_block0.c();
    					if_block0.m(div3, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*currentHeardle*/ ctx[1].artist) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*todaysGame*/ 4) {
    				toggle_class(div3, "bg-custom-positive", /*todaysGame*/ ctx[2].gotCorrect);
    			}

    			if (dirty & /*todaysGame*/ 4) {
    				toggle_class(div3, "bg-custom-mg", !/*todaysGame*/ ctx[2].gotCorrect);
    			}

    			if (dirty & /*currentHeardle*/ 2 && a_href_value !== (a_href_value = /*currentHeardle*/ ctx[1].url)) {
    				attr(a, "href", a_href_value);
    			}

    			if (dirty & /*currentHeardle*/ 2 && a_title_value !== (a_title_value = "Listen to " + /*currentHeardle*/ ctx[1].artist + " - " + /*currentHeardle*/ ctx[1].title + " on SoundCloud")) {
    				attr(a, "title", a_title_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    // (127:16) {:else}
    function create_else_block_3$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-5 h-5");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (77:16) {#if i < userGuesses.length}
    function create_if_block_3$3(ctx) {
    	let div0;
    	let t;
    	let div1;

    	function select_block_type_2(ctx, dirty) {
    		if (/*userGuesses*/ ctx[0][/*i*/ ctx[7]].isCorrect || /*userGuesses*/ ctx[0][/*i*/ ctx[7]].isSkipped) return create_if_block_5$3;
    		return create_else_block_2$2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*userGuesses*/ ctx[0][/*i*/ ctx[7]].isSkipped) return create_if_block_4$3;
    		return create_else_block_1$3;
    	}

    	let current_block_type_1 = select_block_type_3(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	return {
    		c() {
    			div0 = element("div");
    			if_block0.c();
    			t = space();
    			div1 = element("div");
    			if_block1.c();
    			attr(div0, "class", "mr-2");
    			attr(div1, "class", "flex flex-1 justify-between items-center");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			if_block0.m(div0, null);
    			insert(target, t, anchor);
    			insert(target, div1, anchor);
    			if_block1.m(div1, null);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_3(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if_block0.d();
    			if (detaching) detach(t);
    			if (detaching) detach(div1);
    			if_block1.d();
    		}
    	};
    }

    // (100:24) {:else}
    function create_else_block_2$2(ctx) {
    	let svg;
    	let line0;
    	let line1;

    	return {
    		c() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr(line0, "x1", "18");
    			attr(line0, "y1", "6");
    			attr(line0, "x2", "6");
    			attr(line0, "y2", "18");
    			attr(line1, "x1", "6");
    			attr(line1, "y1", "6");
    			attr(line1, "x2", "18");
    			attr(line1, "y2", "18");
    			attr(svg, "class", "text-custom-negative");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, line0);
    			append(svg, line1);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (82:24) {#if userGuesses[i].isCorrect || userGuesses[i].isSkipped}
    function create_if_block_5$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*userGuesses*/ ctx[0][/*i*/ ctx[7]].isSkipped && create_if_block_6$2();

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (/*userGuesses*/ ctx[0][/*i*/ ctx[7]].isSkipped) {
    				if (if_block) ; else {
    					if_block = create_if_block_6$2();
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (83:28) {#if userGuesses[i].isSkipped}
    function create_if_block_6$2(ctx) {
    	let svg;
    	let rect;

    	return {
    		c() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			attr(rect, "x", "3");
    			attr(rect, "y", "3");
    			attr(rect, "width", "18");
    			attr(rect, "height", "18");
    			attr(rect, "rx", "2");
    			attr(rect, "ry", "2");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "class", "text-custom-mg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, rect);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (122:24) {:else}
    function create_else_block_1$3(ctx) {
    	let div;
    	let t_value = /*userGuesses*/ ctx[0][/*i*/ ctx[7]].answer + "";
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", "text-white text-sm");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*userGuesses*/ 1 && t_value !== (t_value = /*userGuesses*/ ctx[0][/*i*/ ctx[7]].answer + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (120:24) {#if userGuesses[i].isSkipped}
    function create_if_block_4$3(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "SKIPPED";
    			attr(div, "class", "text-custom-mg tracking-widest font-semibold");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (72:8) {#each Array(guessCount) as s, i}
    function create_each_block$3(ctx) {
    	let div;
    	let t;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[7] < /*userGuesses*/ ctx[0].length) return create_if_block_3$3;
    		return create_else_block_3$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			attr(div, "class", "p-2 mb-2 border border-custom-mg flex items-center last:mb-0");
    			toggle_class(div, "border-custom-line", /*i*/ ctx[7] == /*userGuesses*/ ctx[0].length);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t);
    				}
    			}

    			if (dirty & /*userGuesses*/ 1) {
    				toggle_class(div, "border-custom-line", /*i*/ ctx[7] == /*userGuesses*/ ctx[0].length);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    		}
    	};
    }

    // (24:16) {#if currentHeardle.img}
    function create_if_block_2$4(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	return {
    		c() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*currentHeardle*/ ctx[1].img)) attr(img, "src", img_src_value);
    			attr(img, "class", "h-14 w-14 ");
    			attr(img, "alt", img_alt_value = "" + (/*currentHeardle*/ ctx[1].artist + " - " + /*currentHeardle*/ ctx[1].title));
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*currentHeardle*/ 2 && !src_url_equal(img.src, img_src_value = /*currentHeardle*/ ctx[1].img)) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*currentHeardle*/ 2 && img_alt_value !== (img_alt_value = "" + (/*currentHeardle*/ ctx[1].artist + " - " + /*currentHeardle*/ ctx[1].title))) {
    				attr(img, "alt", img_alt_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (32:20) {#if currentHeardle.artist}
    function create_if_block_1$4(ctx) {
    	let p0;
    	let t0_value = /*currentHeardle*/ ctx[1].artist + "" + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*currentHeardle*/ ctx[1].title + "" + "";
    	let t2;

    	return {
    		c() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			attr(p0, "class", "");
    			attr(p1, "class", "text-sm ");
    		},
    		m(target, anchor) {
    			insert(target, p0, anchor);
    			append(p0, t0);
    			insert(target, t1, anchor);
    			insert(target, p1, anchor);
    			append(p1, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*currentHeardle*/ 2 && t0_value !== (t0_value = /*currentHeardle*/ ctx[1].artist + "" + "")) set_data(t0, t0_value);
    			if (dirty & /*currentHeardle*/ 2 && t2_value !== (t2_value = /*currentHeardle*/ ctx[1].title + "" + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p0);
    			if (detaching) detach(t1);
    			if (detaching) detach(p1);
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*todaysGame*/ ctx[2].hasFinished) return create_if_block$6;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let guessCount;
    	let { userGuesses } = $$props;
    	let { maxAttempts } = $$props;
    	let { currentHeardle } = $$props;
    	let { todaysGame } = $$props;

    	$$self.$$set = $$props => {
    		if ('userGuesses' in $$props) $$invalidate(0, userGuesses = $$props.userGuesses);
    		if ('maxAttempts' in $$props) $$invalidate(4, maxAttempts = $$props.maxAttempts);
    		if ('currentHeardle' in $$props) $$invalidate(1, currentHeardle = $$props.currentHeardle);
    		if ('todaysGame' in $$props) $$invalidate(2, todaysGame = $$props.todaysGame);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*todaysGame, userGuesses, maxAttempts*/ 21) {
    			$$invalidate(3, guessCount = todaysGame.hasFinished && todaysGame.gotCorrect
    			? userGuesses.length
    			: maxAttempts);
    		}
    	};

    	return [userGuesses, currentHeardle, todaysGame, guessCount, maxAttempts];
    }

    class Guesses extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$b, create_fragment$e, safe_not_equal, {
    			userGuesses: 0,
    			maxAttempts: 4,
    			currentHeardle: 1,
    			todaysGame: 2
    		});
    	}
    }

    /* src\Button.svelte generated by Svelte v3.47.0 */

    function create_fragment$d(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr(button, "class", "px-2 py-2 uppercase tracking-widest bg-custom-mg border-none flex items-center font-semibold text-sm svelte-1r54uzk");
    			toggle_class(button, "bg-custom-positive", /*primary*/ ctx[0]);
    			toggle_class(button, "bg-custom-mg", /*secondary*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*primary*/ 1) {
    				toggle_class(button, "bg-custom-positive", /*primary*/ ctx[0]);
    			}

    			if (dirty & /*secondary*/ 2) {
    				toggle_class(button, "bg-custom-mg", /*secondary*/ ctx[1]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { primary = false } = $$props;
    	let { secondary = false } = $$props;

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('primary' in $$props) $$invalidate(0, primary = $$props.primary);
    		if ('secondary' in $$props) $$invalidate(1, secondary = $$props.secondary);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [primary, secondary, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$d, safe_not_equal, { primary: 0, secondary: 1 });
    	}
    }

    /* src\Header.svelte generated by Svelte v3.47.0 */

    function create_default_slot_3(ctx) {
    	let svg;
    	let circle;
    	let line0;
    	let line1;

    	return {
    		c() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr(circle, "cx", "12");
    			attr(circle, "cy", "12");
    			attr(circle, "r", "10");
    			attr(line0, "x1", "12");
    			attr(line0, "y1", "16");
    			attr(line0, "x2", "12");
    			attr(line0, "y2", "12");
    			attr(line1, "x1", "12");
    			attr(line1, "y1", "8");
    			attr(line1, "x2", "12.01");
    			attr(line1, "y2", "8");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, circle);
    			append(svg, line0);
    			append(svg, line1);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (57:16) <Button                      on:click={() => {                          openModal("donate", "support");                          ga.addEvent("clickDonate", {                              name: "clickDonate",                          });                      }}                  >
    function create_default_slot_2(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (84:16) <Button                      on:click={() => {                          openModal("results", "stats");                          ga.addEvent("clickStats", {                              name: "clickStats",                          });                      }}                  >
    function create_default_slot_1$2(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (108:16) <Button                      on:click={() => {                          openModal("help", "how to play");                          ga.addEvent("clickHelp", {                              name: "clickHelp",                          });                      }}                  >
    function create_default_slot$5(ctx) {
    	let svg;
    	let circle;
    	let path;
    	let line;

    	return {
    		c() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			path = svg_element("path");
    			line = svg_element("line");
    			attr(circle, "cx", "12");
    			attr(circle, "cy", "12");
    			attr(circle, "r", "10");
    			attr(path, "d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3");
    			attr(line, "x1", "12");
    			attr(line, "y1", "17");
    			attr(line, "x2", "12.01");
    			attr(line, "y2", "17");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, circle);
    			append(svg, path);
    			append(svg, line);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	let header;
    	let div3;
    	let div2;
    	let div0;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let h1;
    	let t3;
    	let div1;
    	let button2;
    	let t4;
    	let button3;
    	let current;

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			}
    		});

    	button0.$on("click", /*click_handler*/ ctx[1]);

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			}
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[2]);

    	button2 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			}
    		});

    	button2.$on("click", /*click_handler_2*/ ctx[3]);

    	button3 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			}
    		});

    	button3.$on("click", /*click_handler_3*/ ctx[4]);

    	return {
    		c() {
    			header = element("header");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "TMBG Heardle";
    			t3 = space();
    			div1 = element("div");
    			create_component(button2.$$.fragment);
    			t4 = space();
    			create_component(button3.$$.fragment);
    			attr(div0, "class", "flex flex-1");
    			attr(h1, "class", "font-serif text-3xl font-bold flex-grow text-center flex-1");
    			attr(div1, "class", "flex flex-1 justify-end");
    			attr(div2, "class", "flex justify-evenly text-custom-fgcolor p-3 items-center");
    			attr(div3, "class", "max-w-screen-md mx-auto");
    			attr(header, "class", "border-b border-custom-line");
    		},
    		m(target, anchor) {
    			insert(target, header, anchor);
    			append(header, div3);
    			append(div3, div2);
    			append(div2, div0);
    			mount_component(button0, div0, null);
    			append(div0, t0);
    			mount_component(button1, div0, null);
    			append(div2, t1);
    			append(div2, h1);
    			append(div2, t3);
    			append(div2, div1);
    			mount_component(button2, div1, null);
    			append(div1, t4);
    			mount_component(button3, div1, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(header);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    		}
    	};
    }

    function instance$9($$self) {
    	const dispatch = createEventDispatcher();

    	function openModal(e, n, r) {
    		dispatch("modal", { name: e, title: n, hasFrame: r });
    	}

    	const click_handler = () => {
    		openModal("info", "about");
    		addEvent("clickInfo", { name: "clickInfo" });
    	};

    	const click_handler_1 = () => {
    		openModal("donate", "support");
    		addEvent("clickDonate", { name: "clickDonate" });
    	};

    	const click_handler_2 = () => {
    		openModal("results", "stats");
    		addEvent("clickStats", { name: "clickStats" });
    	};

    	const click_handler_3 = () => {
    		openModal("help", "how to play");
    		addEvent("clickHelp", { name: "clickHelp" });
    	};

    	return [openModal, click_handler, click_handler_1, click_handler_2, click_handler_3];
    }

    class Header extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$c, safe_not_equal, {});
    	}
    }

    /* src\Modal.svelte generated by Svelte v3.47.0 */

    function create_else_block$4(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let div1;
    	let button;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			button = element("button");
    			button.innerHTML = `<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    			t2 = space();
    			if (default_slot) default_slot.c();
    			attr(h2, "class", "text-sm text-center uppercase text-custom-line font-semibold tracking-widest");
    			attr(div0, "class", "flex-1 pl-7");
    			attr(button, "class", "border-none text-custom-mg");
    			button.autofocus = true;
    			attr(div1, "class", "justify-self-end flex");
    			attr(div2, "class", "flex items-center justify-center mb-6");
    			attr(div3, "class", "bg-custom-bg border border-custom-mg p-6");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div0, h2);
    			append(h2, t0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div1, button);
    			append(div3, t2);

    			if (default_slot) {
    				default_slot.m(div3, null);
    			}

    			current = true;
    			button.focus();

    			if (!mounted) {
    				dispose = listen(button, "click", /*close*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (!current || dirty & /*title*/ 1) set_data(t0, /*title*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[5],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (52:8) {#if hasFrame == 0}
    function create_if_block$5(ctx) {
    	let button;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	return {
    		c() {
    			button = element("button");
    			button.innerHTML = `<svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    			t = space();
    			if (default_slot) default_slot.c();
    			button.autofocus = true;
    			attr(button, "class", "border-none text-custom-mg absolute right-3 top-3");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			insert(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    			button.focus();

    			if (!mounted) {
    				dispose = listen(button, "click", /*close*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[5],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			if (detaching) detach(t);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	let div0;
    	let t;
    	let div2;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*hasFrame*/ ctx[1] == 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div0 = element("div");
    			t = space();
    			div2 = element("div");
    			div1 = element("div");
    			if_block.c();
    			attr(div0, "class", "modal-background p-3 flex justify-center svelte-1nyqrwd");
    			attr(div1, "class", "pointer-events-auto modal max-w-screen-xs w-full mx-auto top-20 relative rounded-sm");
    			attr(div1, "role", "dialog");
    			attr(div1, "aria-modal", "true");
    			attr(div2, "class", "modal-background p-3 pointer-events-none svelte-1nyqrwd");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t, anchor);
    			insert(target, div2, anchor);
    			append(div2, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			/*div1_binding*/ ctx[7](div1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "keydown", /*handle_keydown*/ ctx[4]),
    					listen(div0, "click", /*close*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, null);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t);
    			if (detaching) detach(div2);
    			if_blocks[current_block_type_index].d();
    			/*div1_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	const close = () => dispatch("close");
    	let modal;
    	let { title } = $$props;
    	let { hasFrame } = $$props;

    	const handle_keydown = e => {
    		if (e.key === 'Escape') {
    			close();
    			return;
    		}

    		if (e.key === 'Tab') {
    			// trap focus
    			const nodes = modal.querySelectorAll('*');

    			const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);
    			let index = tabbable.indexOf(document.activeElement);
    			if (index === -1 && e.shiftKey) index = 0;
    			index += tabbable.length + (e.shiftKey ? -1 : 1);
    			index %= tabbable.length;
    			tabbable[index].focus();
    			e.preventDefault();
    		}
    	};

    	const previously_focused = typeof document !== 'undefined' && document.activeElement;

    	if (previously_focused) {
    		onDestroy(() => {
    			previously_focused.focus();
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			modal = $$value;
    			$$invalidate(2, modal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('hasFrame' in $$props) $$invalidate(1, hasFrame = $$props.hasFrame);
    		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	return [title, hasFrame, modal, close, handle_keydown, $$scope, slots, div1_binding];
    }

    class Modal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$b, safe_not_equal, { title: 0, hasFrame: 1 });
    	}
    }

    /* src\InfoModal.svelte generated by Svelte v3.47.0 */

    function create_fragment$a(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");

    			div.innerHTML = `<p class="mb-3">A clone of Heardle (now defunct) but for songs by the band They Might Be Giants.</p>  

    <p class="mb-3">Each TMBG Heardle is randomly chosen from TMBG&#39;s discography (and I will probably add tracks from the Johns&#39; side projects at some point.)</p>  



     <p></p>   



      <p class="text-xs mb-3 text-custom-line">Prepared with <a href="https://developers.soundcloud.com">Soundcloud</a>,
        <a href="https://svelte.dev">Svelte</a>,
        <a href="https://tailwindcss.com">Tailwind</a>,

        <a href="https://fonts.google.com/noto/specimen/Noto+Serif+Display">Noto Serif Display</a>,
        <a href="https://fonts.google.com/noto/specimen/Noto+Sans">Noto Sans</a>,

        <a href="https://iconsvg.xyz">IconSVG</a>, <a href="https://momentjs.com">momentjs</a>,
        
        <a href="https://tarekraafat.github.io/autoComplete.js/#/">autocomplete.js</a>, and powered by
        <a href="https://glitch.com/">Glitch</a>. Original Heardle by
        <a href="https://omakase.studio" title="Studio Omakase">Studio omakase / お任せ</a>. TMBG version is currently
        maintained by <a href="https://twitter.com/ZorMonkey">Joe</a>. Original was created by
        <a href="https://twitter.com/ckolderup">casey</a></p>`;

    			attr(div, "class", "text");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class InfoModal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$a, safe_not_equal, {});
    	}
    }

    /* src\DonateModal.svelte generated by Svelte v3.47.0 */

    function create_fragment$9(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	return {
    		c() {
    			p0 = element("p");
    			p0.textContent = "Thanks to svt-heardle.glitch.me for the remixable copy of Heardle.app.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "And obviously thank you to the Johns for 40 years (and counting) of great music!";
    			attr(p0, "class", "mb-3");
    			attr(p1, "class", "mb-3");
    		},
    		m(target, anchor) {
    			insert(target, p0, anchor);
    			insert(target, t1, anchor);
    			insert(target, p1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(p0);
    			if (detaching) detach(t1);
    			if (detaching) detach(p1);
    		}
    	};
    }

    class DonateModal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$9, safe_not_equal, {});
    	}
    }

    /* src\HelpModal.svelte generated by Svelte v3.47.0 */

    function create_default_slot$4(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Play");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let div10;
    	let div2;
    	let t2;
    	let div5;
    	let t5;
    	let div8;
    	let t8;
    	let div9;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", /*onClick*/ ctx[0]);

    	return {
    		c() {
    			div10 = element("div");
    			div2 = element("div");

    			div2.innerHTML = `<div class="mr-4 w-8 text-custom-line"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7"><circle cx="5.5" cy="17.5" r="2.5"></circle><circle cx="17.5" cy="15.5" r="2.5"></circle><path d="M8 17V5l12-2v12"></path></svg></div> 
        <div><p>Listen to the intro, then find the correct TMBG song in the list.</p></div>`;

    			t2 = space();
    			div5 = element("div");

    			div5.innerHTML = `<div class="mr-4 w-8 text-custom-line"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></div> 
        <div><p>Skipped or incorrect attempts unlock more of the intro</p></div>`;

    			t5 = space();
    			div8 = element("div");

    			div8.innerHTML = `<div class="mr-4 w-8 text-custom-line"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-7"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div> 
        <div><p>Answer in as few tries as possible and share your score!</p></div>`;

    			t8 = space();
    			div9 = element("div");
    			create_component(button.$$.fragment);
    			attr(div2, "class", "flex items-center mb-6");
    			attr(div5, "class", "flex items-center mb-6");
    			attr(div8, "class", "flex items-center mb-6");
    			attr(div9, "class", "justify-center flex py-2 mt-2");
    		},
    		m(target, anchor) {
    			insert(target, div10, anchor);
    			append(div10, div2);
    			append(div10, t2);
    			append(div10, div5);
    			append(div10, t5);
    			append(div10, div8);
    			append(div10, t8);
    			append(div10, div9);
    			mount_component(button, div9, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div10);
    			destroy_component(button);
    		}
    	};
    }

    function instance$7($$self) {
    	const dispatch = createEventDispatcher();
    	const onClick = () => dispatch("close");
    	return [onClick];
    }

    class HelpModal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, {});
    	}
    }

    const idOffset = 266;
        const potentialAnswers = [{answer:"(She Was A) Hotel Detective - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/she-was-a-hotel-detective-2"},{answer:"2082 - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/2082-1"},{answer:"32 Footsteps - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/32-footsteps-1"},{answer:"9 Secret Steps - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/9-secret-steps-1"},{answer:"A Self Called Nowhere - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/a-self-called-nowhere"},{answer:"Aaa - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/aaa"},{answer:"Absolutely Bill's Mood - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/absolutely-bills-mood-1"},{answer:"AKA Driver - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/aka-driver"},{answer:"Alienation's for the Rich - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/alienations-for-the-rich-1"},{answer:"All the Lazy Boyfriends - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/all-the-lazy-boyfriends"},{answer:"All Time What - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/all-time-what"},{answer:"Alphabet Lost and Found - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/alphabet-lost-and-found"},{answer:"Alphabet of Nations - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/alphabet-of-nations"},{answer:"Am I Awake? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/am-i-awake-2"},{answer:"An Insult to the Fact Checkers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/an-insult-to-the-fact-checkers"},{answer:"Ana Ng - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ana-ng-3"},{answer:"And Mom and Kid - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/and-mom-and-kid-1"},{answer:"Another First Kiss - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/another-first-kiss-1"},{answer:"Answer - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/answer"},{answer:"Ant - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ant"},{answer:"Apartment Four - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/apartment-four"},{answer:"Apophenia - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/apophenia"},{answer:"Au Contraire - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/au-contraire-1"},{answer:"Bangs - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/bangs-1"},{answer:"Bastard Wants to Hit Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/bastard-wants-to-hit-me"},{answer:"Become a Robot - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/become-a-robot"},{answer:"Bed Bed Bed - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/bed-bed-bed"},{answer:"Bee of the Bird of the Moth - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/bee-of-the-bird-of-the-moth"},{answer:"Bills, Bills, Bills - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/bills-bills-bills"},{answer:"Birdhouse in Your Soul - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/birdhouse-in-your-soul-1"},{answer:"Birds Fly - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/birds-fly-1"},{answer:"Black Ops - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/black-ops-1"},{answer:"Black Ops Alt - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/black-ops-alt"},{answer:"Boat of Car - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/boat-of-car-1"},{answer:"Boss of Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/boss-of-me"},{answer:"Brain Problem Situation - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/brain-problem-situation-1"},{answer:"Broke in Two - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/broke-in-two"},{answer:"Brontosaurus - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/brontosaurus"},{answer:"By The Time You Get This - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/by-the-time-you-get-this-note"},{answer:"C Is for Conifers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/c-is-for-conifers"},{answer:"Cage & Aquarium - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cage-aquarium-1"},{answer:"Call You Mom - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/call-you-mom-2"},{answer:"Can You Find It? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/can-you-find-it"},{answer:"Can't Keep Johnny Down - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cant-keep-johnny-down-2"},{answer:"Canada Haunts Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/canada-haunts-me"},{answer:"Canajoharie - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/canajoharie"},{answer:"Careful What You Pack - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/careful-what-you-pack-2"},{answer:"Caroline, No - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/caroline-no"},{answer:"Celebration - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/celebration-1"},{answer:"Cells - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cells"},{answer:"Certain People I Could Name - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/certain-people-i-could-name"},{answer:"Chess Piece Face - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/chess-piece-face-1"},{answer:"Circular Karate Chop - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/circular-karate-chop-1"},{answer:"Clap Your Hands - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/clap-your-hands-2"},{answer:"Climbing the Walls - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/climbing-the-walls"},{answer:"Cloissonné - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cloissone"},{answer:"Computer Assisted Design - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/computer-assisted-design"},{answer:"Contrecoup - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/contrecoup"},{answer:"Counterfeit Faker - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/counterfeit-faker"},{answer:"Cowtown - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cowtown-1"},{answer:"Cyclops Rock - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/cyclops-rock-1"},{answer:"D & W - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/d-w"},{answer:"D Is for Drums - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/d-is-for-drums"},{answer:"Damn Good Times - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/damn-good-times-1"},{answer:"Dark and Metric - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dark-and-metric"},{answer:"Darling, The Dose - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/darling-the-dose"},{answer:"Daylight - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/daylight"},{answer:"Dead - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dead"},{answer:"Decision Makers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/decision-makers-1"},{answer:"Definition of Good - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/definition-of-good-1"},{answer:"Destination Moon - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/destination-moon"},{answer:"Destroy the Past - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/destroy-the-past-1"},{answer:"Didn't Kill Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/didnt-kill-me-1"},{answer:"Dig My Grave - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dig-my-grave"},{answer:"Dinner Bell - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dinner-bell"},{answer:"Dirt Bike - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dirt-bike"},{answer:"Dog Walker - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dog-walker"},{answer:"Don't Let's Start - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/dont-lets-start-2"},{answer:"Drink! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/drink-2"},{answer:"Drinkin' - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/drinkin"},{answer:"Drown the Clown - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/drown-the-clown"},{answer:"E Eats Everything - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/e-eats-everything"},{answer:"ECNALUBMA - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ecnalubma"},{answer:"Eight Hundred and Thirteen Mile Car Trip - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/eight-hundred-and-thirteen"},{answer:"Electric Car - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/electric-car"},{answer:"Elephants (feat. Danny Weinkauf) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/elephants-feat-danny"},{answer:"Empty Bottle Collector - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/empty-bottle-collector"},{answer:"End of the Rope - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/end-of-the-rope"},{answer:"Erase - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/erase-1"},{answer:"Even Numbers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/even-numbers"},{answer:"Everything Right Is Wrong Again - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/everything-right-is-wrong-1"},{answer:"Experimental Film - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/experimental-film-1"},{answer:"Exquisite Dead Guy - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/exquisite-dead-guy"},{answer:"Extra Savoir Faire - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/extra-savoir-faire"},{answer:"Fake-Believe - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/fake-believe"},{answer:"Feast of Lights - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/feast-of-lights-1"},{answer:"Feign Amnesia - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/feign-amnesia"},{answer:"Fibber Island - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/fibber-island"},{answer:"Figure Eight - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/figure-eight"},{answer:"Fingertips - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/fingertips-combined"},{answer:"Finished with Lies - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/finished-with-lies-1"},{answer:"Flying V - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/flying-v"},{answer:"For Science - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/for-science-1"},{answer:"Four of Two - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/four-of-two"},{answer:"Fun Assassin - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/fun-assassin"},{answer:"Glean - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/glean"},{answer:"Go for G! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/go-for-g"},{answer:"Good to Be Alive - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/good-to-be-alive"},{answer:"Goodnight My Friends - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/goodnight-my-friends"},{answer:"Got Getting up so Down - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/got-getting-up-so-down"},{answer:"Great - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/great-1"},{answer:"Hall of Heads - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hall-of-heads"},{answer:"Hate the Villanelle - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hate-the-villanelle"},{answer:"Hearing Aid - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hearing-aid"},{answer:"Heart Of The Band - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/heart-of-the-band"},{answer:"Hello Mrs. Wheelyke - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hello-mrs-wheelyke-1"},{answer:"Hello Radio - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hello-radio-1"},{answer:"Here Comes Science - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/here-comes-science"},{answer:"Here in Higglytown (Theme to Playhouse Disney's Higglytown Heroes) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/higglytown-heroes-theme-album"},{answer:"Hey, Mr. DJ, I Thought You Said We Had a Deal - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hey-mr-dj-i-thought-you-said-1"},{answer:"Hide Away Folk Family - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hide-away-folk-family-1"},{answer:"High Five! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/high-five"},{answer:"Hive Mind - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hive-mind-1"},{answer:"Hopeless Bleak Despair - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hopeless-bleak-dispair"},{answer:"Hot Cha - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hot-cha"},{answer:"Hot Dog! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hot-dog"},{answer:"Hovering Sombrero - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hovering-sombrero-1"},{answer:"How Can I Sing Like a Girl? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/how-can-i-sing-like-a-girl-1"},{answer:"How Many Planets? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/how-many-planets"},{answer:"Hypnotist of Ladies - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/hypnotist-of-ladies"},{answer:"I Am a Grocery Bag - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-a-grocery-bag"},{answer:"I Am a Human Head - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-a-human-head"},{answer:"I Am a Paleontologist - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-a-paleontologist"},{answer:"I Am Alone - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-alone"},{answer:"I Am Invisible - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-invisible-1"},{answer:"I Am Not Your Broom - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-am-not-your-broom"},{answer:"I Broke My Own Rule - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-broke-my-own-rule"},{answer:"I C U - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-c-u"},{answer:"I Can Add - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-can-add"},{answer:"I Can Hear You - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-can-hear-you"},{answer:"I Can Help the Next in Line - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-can-help-the-next-in-line"},{answer:"I Can't Hide from My Mind - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-cant-hide-from-my-mind"},{answer:"I Can't Remember the Dream - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-cant-remember-the-dream"},{answer:"I Haven't Seen You in Forever - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-havent-seen-you-in-forever-1"},{answer:"I Hope That I Get Old Before I Die - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-hope-that-i-get-old-before-1"},{answer:"I Just Want to Dance - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-just-want-to-dance-1"},{answer:"I Left My Body - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-left-my-body"},{answer:"I Like Fun - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-like-fun"},{answer:"I Lost Thursday - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-lost-thursday"},{answer:"I Love You for Psychological Reasons - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-love-you-for-psychological"},{answer:"I Made a Mess - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-made-a-mess-1"},{answer:"I Palindrome I - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-palindrome-i"},{answer:"I Should Be Allowed to Think - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-should-be-allowed-to-think"},{answer:"I Wasn't Listening - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/i-wasnt-listening"},{answer:"I'll Be Haunting You - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ill-be-haunting-you"},{answer:"I'll Sink Manhattan - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ill-sink-manhattan-1"},{answer:"I'm a Coward - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/im-a-coward"},{answer:"I'm All That You Can Think Of - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/im-all-that-you-can-think-of"},{answer:"I'm Gettin' Sentimental over You (Adaptation) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/im-gettin-sentimental-over-you"},{answer:"I'm Impressed - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/im-impressed-1"},{answer:"I've Got a Fang - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ive-got-a-fang-1"},{answer:"I've Got a Match - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ive-got-a-match-1"},{answer:"Icky - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/icky-1"},{answer:"If Day for Winnipeg - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/if-day-for-winnipeg"},{answer:"If I Wasn't Shy - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/if-i-wasnt-shy"},{answer:"Impossibly New - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/impossibly-new"},{answer:"In Fact - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/in-fact"},{answer:"In the Middle, In the Middle, In the Middle - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/in-the-middle-in-the-middle-in"},{answer:"Infinity - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/infinity-they-might-be-giants"},{answer:"Insect Hospital - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/insect-hospital-1"},{answer:"Istanbul (Not Constantinople) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/istanbul-not-constantinople-2"},{answer:"It Said Something - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/it-said-something"},{answer:"It's Kickin' In - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/its-kickin-in"},{answer:"It's Not My Birthday - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/its-not-my-birthday-1"},{answer:"James K. Polk - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/james-k-polk"},{answer:"Jessica - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/jessica"},{answer:"John Lee Supertaster - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/john-lee-supertaster"},{answer:"Judy Is Your Viet Nam - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/judy-is-your-viet-nam-1"},{answer:"Kiss Me, Son of God - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/kiss-me-son-of-god-1"},{answer:"Kiss Me, Son of God - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/kiss-me-sun-of-god-alternate"},{answer:"L M N O - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/l-m-n-o"},{answer:"Lady Is a Tramp - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lady-is-a-tramp-1"},{answer:"Lake Monsters - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lake-monsters"},{answer:"Last Wave - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/last-wave"},{answer:"Lazyhead and Sleepbones - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lazyhead-and-sleepbones"},{answer:"Less Than One - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/less-than-one"},{answer:"Let Me Tell You About My Operation - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/let-me-tell-you-about-my"},{answer:"Let Your Hair Hang Down - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/let-your-hair-hang-down"},{answer:"Let's Get This Over With - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lets-get-this-over-with"},{answer:"Letter /  Not a Letter - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/letter-not-a-letter"},{answer:"Letter Shapes - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/letter-shapes"},{answer:"Letterbox - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/letterbox"},{answer:"Lie Still, Little Bottle - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lie-still-little-bottle-1"},{answer:"Long White Beard (feat. Robin Goldwasser) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/long-white-beard-feat-robin"},{answer:"Lord Snowdon - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lord-snowden"},{answer:"Lost My Mind - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lost-my-mind-2"},{answer:"Lucky Ball and Chain - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lucky-ball-and-chain"},{answer:"Lullaby to Nightmares - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/lullaby-to-nightmares"},{answer:"MacGyver - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/macgyver"},{answer:"Madam, I Challenge You to a Duel - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/madam-i-challenge-you-to-a-1"},{answer:"Mammal - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mammal"},{answer:"Man, It's So Loud in Here - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/man-its-so-loud-in-here-1"},{answer:"Maybe I Know - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/maybe-i-know"},{answer:"McCafferty's Bib - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mccaffertys-bib"},{answer:"Meet James Ensor - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/meet-james-ensor-1"},{answer:"Meet the Elements - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/meet-the-elements"},{answer:"Memo to Human Resources - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/memo-to-human-resources"},{answer:"Metal Detector - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/metal-detector"},{answer:"Mickey Mouse Clubhouse Theme - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mickey-mouse-clubhouse"},{answer:"Minimum Wage - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/minimum-wage"},{answer:"Mink Car - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mink-car-1"},{answer:"Moles, Hounds, Bears, Bees and Hares - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/moles-hounds-bears-bees-and"},{answer:"Moonbeam Rays - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/moonbeam-rays"},{answer:"Mr. Klaw - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mr-klaw-1"},{answer:"Mr. Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mr-me-1"},{answer:"Mr. Xcitement - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mr-xcitement-1"},{answer:"Mrs. Bluebeard - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/mrs-bluebeard"},{answer:"Museum of Idiots - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/museum-of-idiots"},{answer:"Music Jail, Pt. 1 & 2 - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/music-jail-pt-1-2"},{answer:"My Brother the Ape - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/my-brother-the-ape"},{answer:"My Evil Twin - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/my-evil-twin"},{answer:"My Man - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/my-man-1"},{answer:"Nanobots - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nanobots-2"},{answer:"Narrow Your Eyes - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/narrow-your-eyes"},{answer:"Never Knew Love - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/never-knew-love"},{answer:"New York City - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/new-york-city"},{answer:"Nightgown of the Sullen Moon - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nightgown-of-the-sullen-moon-1"},{answer:"Nine Bowls of Soup - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nine-bowls-of-soup"},{answer:"No One Knows My Plan - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/no-one-knows-my-plan"},{answer:"No! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/no"},{answer:"Nonagon - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nonagon"},{answer:"Nothing's Gonna Change My Clothes - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nothings-gonna-change-my-1"},{answer:"Nouns - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/nouns-1"},{answer:"Now Is Strange - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/now-is-strange"},{answer:"Now That I Have Everything - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/now-that-i-have-everything"},{answer:"Number Three - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/number-three-1"},{answer:"Number Two - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/number-two"},{answer:"O Do Not Forsake Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/o-do-not-forsake-me"},{answer:"O Tannenbaum - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/o-tannenbaum-1"},{answer:"Oh You Did (feat. Robin Goldwasser) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/oh-you-did-feat-robin"},{answer:"Old Pine Box - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/old-pine-box"},{answer:"Older - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/older-2"},{answer:"Omnicorn - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/omnicorn-1"},{answer:"On Earth My Nina - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/on-earth-my-nina"},{answer:"On the Drag - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/on-the-drag"},{answer:"One Dozen Monkeys - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/one-dozen-monkeys"},{answer:"One Everything - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/one-everything"},{answer:"Ooh La! Ooh La! - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ooh-la-ooh-la"},{answer:"Operators Are Standing By - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/operators-are-standing-by"},{answer:"Or so I Have Read - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/or-so-i-have-read-1"},{answer:"Other Father Song - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/other-father-song"},{answer:"Out of a Tree - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/out-of-a-tree-1"},{answer:"Out of Jail - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/out-of-jail"},{answer:"Part of You Wants to Believe Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/part-of-you-wants-to-believe"},{answer:"Particle Man - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/particle-man-1"},{answer:"Pencil Rain - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/pencil-rain-1"},{answer:"Pet Name - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/pet-name"},{answer:"Photosynthesis - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/photosynthesis"},{answer:"Pictures of Pandas Painting - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/pictures-of-pandas-painting"},{answer:"Piece of Dirt - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/piece-of-dirt-1"},{answer:"Pirate Girls Nine - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/pirate-girls-nine"},{answer:"Prevenge - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/prevenge"},{answer:"Protagonist - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/protagonist"},{answer:"Purple Toupee - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/purple-toupee-1"},{answer:"Push Back the Hands - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/push-back-the-hands"},{answer:"Put It to the Test - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/put-it-to-the-test"},{answer:"Put Your Hand Inside the Puppet Head - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/put-your-hand-inside-the-1"},{answer:"Q U - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/q-u-album-version"},{answer:"Quit the Circus - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/quit-the-circus"},{answer:"Rabid Child - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/rabid-child-1"},{answer:"Rat Patrol - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/rat-patrol"},{answer:"Replicant - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/replicant-1"},{answer:"Reprehensible - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/reprehensible"},{answer:"Rest Awhile - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/rest-awhile"},{answer:"Rhythm Section Want Ad - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/rhythm-section-want-ad-1"},{answer:"Road Movie to Berlin - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/road-movie-to-berlin"},{answer:"Robot Parade - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/robot-parade"},{answer:"Robot Parade (Adult Version) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/robot-parade-adult-version"},{answer:"Rolling O - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/rolling-o"},{answer:"Roy G. Biv - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/roy-g-biv"},{answer:"S-E-X-X-Y - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/s-e-x-x-y-1"},{answer:"Santa Claus - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/santa-claus-1"},{answer:"Santa's Beard - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/santas-beard-4"},{answer:"Sapphire Bullets of Pure Love - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sapphire-bullets-of-pure-love"},{answer:"Say Nice Things About Detroit - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/say-nice-things-about-detroit"},{answer:"Science Is Real - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/science-is-real"},{answer:"See the Constellation - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/see-the-constellation"},{answer:"Seven - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/seven"},{answer:"Seven Days Of The Week (I Never Go To Work) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/seven-days-of-the-week-i-never"},{answer:"Shape Shifter - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/shape-shifter"},{answer:"She Thinks She's Edith Head - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/she-thinks-shes-edith-head-2"},{answer:"She's Actual Size - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/shes-actual-size-1"},{answer:"She's an Angel - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/shes-an-angel-2"},{answer:"Shoehorn with Teeth - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/shoehorn-with-teeth-1"},{answer:"Skullivan - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/skullivan"},{answer:"Sleep - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sleep-1"},{answer:"Sleeping in the Flowers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sleeping-in-the-flowers-1"},{answer:"Sleepwalkers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sleepwalkers"},{answer:"Snail Shell - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/snail-shell"},{answer:"Snowball in Hell - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/snowball-in-hell-1"},{answer:"So Crazy for Books - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/so-crazy-for-books-1"},{answer:"Sold My Mind to the Kremlin - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sold-my-mind-to-the-kremlin"},{answer:"Solid Liquid Gas - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/solid-liquid-gas"},{answer:"Someone Keeps Moving My Chair - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/someone-keeps-moving-my-chair"},{answer:"Sometimes a Lonely Way - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/sometimes-a-lonely-way-1"},{answer:"Space Suit - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/space-suit"},{answer:"Speed and Velocity - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/speed-and-velocity"},{answer:"Spider - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spider-1"},{answer:"Spine - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spine"},{answer:"Spines - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spines"},{answer:"Spiraling Shape - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spiraling-shape"},{answer:"Spoiler Alert - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spoiler-alert"},{answer:"Spy - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spy-1"},{answer:"Spy - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/spy-unreleased-live-version"},{answer:"Stalk of Wheat - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/stalk-of-wheat"},{answer:"Stand on Your Own Head - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/stand-on-your-head"},{answer:"Stomp Box - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/stomp-box"},{answer:"Stone Cold Coup D'etat - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/stone-cold-coup-detat-1"},{answer:"Stuff Is Way - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/stuff-is-way-1"},{answer:"Subliminal - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/subliminal"},{answer:"Super Cool - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/super-cool"},{answer:"Synopsis for Latecomers - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/synopsis-for-latecomers"},{answer:"Take out the Trash - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/take-out-the-trash"},{answer:"Ten Mississippi - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/ten-mississippi"},{answer:"Tesla - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/tesla-2"},{answer:"The Ballad of Davy Crockett (in Outer Space) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-ballad-of-davy-crockett-in"},{answer:"The Bells Are Ringing - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-bells-are-ringing"},{answer:"The Biggest One - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-biggest-one-1"},{answer:"The Bloodmobile - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-bloodmobile"},{answer:"The Bright Side - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-bright-side"},{answer:"The Cap'm - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-capm"},{answer:"The Darlings of Lumberland - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-darlings-of-lumberland-2"},{answer:"The Day - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-day-1"},{answer:"The Edison Museum - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-edison-museum-1"},{answer:"The End of the Tour - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-end-of-the-tour"},{answer:"The Famous Polka - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-famous-polka-1"},{answer:"The Greatest - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-greatest"},{answer:"The Guitar - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-guitar"},{answer:"The House at the Top of the Tree - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-house-at-the-top-of-the"},{answer:"The Lady and the Tiger - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-lady-and-the-tiger-1"},{answer:"The Mesopotamians - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-mesopotamians-2"},{answer:"The Other Side of the World - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-other-side-of-the-world"},{answer:"The Secret Life Of Six - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-secret-life-of-six"},{answer:"The Shadow Government - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-shadow-government"},{answer:"The Spine Surfs Alone - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-spine-surfs-alone"},{answer:"The Statue Got Me High - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-statue-got-me-high"},{answer:"The Vowel Family - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-vowel-family"},{answer:"The World Before Later On - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-world-before-later-on"},{answer:"The World's Address - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-worlds-address-1"},{answer:"The World's Address (Joshua Fried Remix) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/the-worlds-address-joshua-1"},{answer:"Theme from Flood - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/theme-from-flood"},{answer:"Then the Kids Took Over - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/then-the-kids-took-over-1"},{answer:"There - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/there-1"},{answer:"Thermostat - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/thermostat"},{answer:"They Got Lost - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/they-got-lost"},{answer:"They Might Be Giants - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/they-might-be-giants"},{answer:"They'll Need a Crane - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/theyll-need-a-crane-1"},{answer:"Thinking Machine - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/thinking-machine-1"},{answer:"This Microphone - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/this-microphone"},{answer:"Three Might Be Duende - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/three-might-be-duende"},{answer:"Thunderbird - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/thunderbird"},{answer:"Tick - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/tick-1"},{answer:"Till My Head Falls Off - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/till-my-head-falls-off-1"},{answer:"To a Forest - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/to-a-forest"},{answer:"Toddler Hiway - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/toddler-hiway-1"},{answer:"Token Back to Brooklyn - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/token-back-to-brooklyn"},{answer:"Too Tall Girl - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/too-tall-girl-1"},{answer:"Triops Has Three Eyes - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/triops-has-three-eyes"},{answer:"Trouble Awful Devil Evil - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/trouble-awful-devil-evil-1"},{answer:"Tubthumping (feat. The Onion Av Club Choir) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/tubthumping-feat-the-onion-av"},{answer:"Turn Around - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/turn-around"},{answer:"Twisting - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/twisting"},{answer:"Underwater Woman - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/underwater-woman"},{answer:"Unpronounceable - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/unpronounceable"},{answer:"Unrelated Thing - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/unrelated-thing"},{answer:"Upside Down Frown - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/upside-down-frown"},{answer:"Violin - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/violin"},{answer:"Wait Actually Yeah No - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/wait-actually-yeah-no"},{answer:"Wake up Call - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/wake-up-call"},{answer:"Walking My Cat Named Dog - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/walking-my-cat-named-dog-1"},{answer:"We Live in a Dump - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/we-live-in-a-dump-2"},{answer:"We Want a Rock - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/we-want-a-rock"},{answer:"We're the Replacements - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/were-the-replacements-1"},{answer:"Wearing a Raincoat - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/wearing-a-raincoat"},{answer:"Weep Day - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/weep-day"},{answer:"What Did I Do to You? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/what-did-i-do-to-you"},{answer:"What Is a Shooting Star? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/what-is-a-shooting-star"},{answer:"When It Rains It Snows - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/when-it-rains-it-snows-1"},{answer:"When the Lights Come On - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/when-the-lights-come-on"},{answer:"When Will You Die? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/when-will-you-die-1"},{answer:"Where Do They Make Balloons? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/where-do-they-make-balloons"},{answer:"Where Your Eyes Don't Go - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/where-your-eyes-dont-go-1"},{answer:"Which Describes How You're Feeling - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/which-describes-how-youre-1"},{answer:"Whirlpool - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/whirlpool"},{answer:"Whistling in the Dark - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/whistling-in-the-dark"},{answer:"Who Put the Alphabet in Alphabetical Order? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/who-put-the-alphabet-in"},{answer:"Why Does the Sun Really Shine? (The Sun Is a Miasma of Incandescent Plasma) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/why-does-the-sun-really-shine"},{answer:"Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine"},{answer:"Why Does the Sun Shine? (The Sun Is a Mass of Incandescent Gas) - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/why-does-the-sun-shine-the-1"},{answer:"Why Must I Be Sad? - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/why-must-i-be-sad"},{answer:"Wicked Little Critta - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/wicked-little-critta-1"},{answer:"Window - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/window"},{answer:"With the Dark - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/with-the-dark"},{answer:"Withered Hope - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/withered-hope-1"},{answer:"Women & Men - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/women-men"},{answer:"Working Undercover for the Man - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/working-undercover-for-the-1"},{answer:"XTC vs. Adam Ant - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/xtc-vs-adam-ant-1"},{answer:"Yeh Yeh - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/yeh-yeh-1"},{answer:"You Don't Like Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/you-dont-like-me"},{answer:"You Probably Get That a Lot - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/you-probably-get-that-a-lot"},{answer:"You'll Miss Me - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/youll-miss-me-1"},{answer:"You're on Fire - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/youre-on-fire-3"},{answer:"Your Mom's Alright - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/your-moms-alright"},{answer:"Your Own Worst Enemy - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/your-own-worst-enemy"},{answer:"Your Racist Friend - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/your-racist-friend"},{answer:"Youth Culture Killed My Dog - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/youth-culture-killed-my-dog-1"},{answer:"Z Y X - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/z-y-x"},{answer:"Zeroes - They Might Be Giants",url:"https://soundcloud.com/they-might-be-giants/zeroes"}];
        const answerIndexes = [226,196,169,238,95,35,181,9,234,248,46,171,267,369,307,304,336,273,87,217,40,298,387,78,325,243,57,41,182,165,185,292,178,99,350,326,112,175,130,76,154,222,332,264,47,334,15,244,372,208,277,187,377,202,289,206,353,299,96,155,131,249,71,320,398,216,337,92,156,301,389,51,180,170,30,19,17,14,37,200,172,18,380,374,2,257,116,158,157,414,129,146,356,363,65,107,342,313,335,344,72,0,381,152,73,27,268,365,13,140,141,385,195,135,312,405,44,392,147,113,343,308,21,262,186,173,59,90,62,252,223,162,127,384,407,105,188,45,120,149,396,213,404,270,366,383,123,194,164,86,139,204,168,368,197,240,393,415,411,161,261,413,283,382,39,75,100,253,373,82,166,305,331,315,58,211,38,330,228,221,80,66,408,24,29,233,323,10,231,286,354,218,23,401,25,303,28,265,321,232,54,79,310,5,91,412,348,370,179,124,31,115,364,183,256,64,136,400,1,340,327,294,318,137,291,410,334,199,272,191,165,76,336,304,375,33,214,34,406,219,50,349,93,22,88,352,358,377,299,99,227,159,207,353,289,60,248,398,52,8,224,200,69,206,174,391,290,371,4,32,403,37,177,131,12,102,77,158,192,345,324,7,347,133,78,341,185,245,47,202,250,2,322,264,156,275,110,15,36,357,109,273,148,57,262,316,388,380,372,104,189,362,40,243,332,405,402,146,301,113,74,26,92,112,252,41,51,163,335,255,175,21,170,20,126,157,280,308,295,244,337,144,155,374,85,45,384,282,147,198,271,270,320,30,6,363,376,9,129,356,75,225,195,212,116,63,369,394,281,344,106,10,178,201,330,46,154,228,29,360,169,166,386,13,286,105,142,96,213,284,401,381,269,16,172,389,19,65,232,413,38,312,209,27,220,315,62,359,35,119,277,218,68,314,124,319,111,49,233,263,194,179,373,100,0,182,3,55,130,307,22,237,340,406,107,25,377,181,299,196,329,411,187,58,400,291,11,91,327,298,283,343,90,311,259,183,365,412,206,304,323,70,153,44,67,136,387,231,86,210,375,398,370,32,135,202,162,358,93,382,221,33,159,408,391,94,371,207,18,399,148,173,149,272,54,410,236,78,347,324,388,256,199,334,158,99,354,254,407,379,255,393,321,385,177,140,47,403,131,64,333,122,305,155,309,7,336,355,34,120,224,57,79,108,164,368,261,4,335,192,274,215,147,48,121,175,72,197,74,316,344,116,198,266,88,285,268,362,271,15,360,157,234,303,349,171,339,105,160,14,353,345,167,174,110,80,322,292,369,40,17,43,24,242,248,73,163,381,318,30,59,264,384,126,227,156,225,253,243,19,363,195,233,313,124,6,416,166,27,212,204,326,216,366,102,286,263,294,82,279,35,113,359,314,52,50,290,252,51,10,150,307,96,161,350,1,320,244,201,41,182,181,141,53,144,330,299,409,170,365,413,133,232,312,260,107,250,2,337,262,191,217,60,71,259,159,25,397,298,119,398,275,220,380,165,187,169,308,221,115,186,410,343,296,202,104,280,414,329,76,390,91,162,387,65,78,269,207,47,214,32,94,199,129,38,58,185,55,295,196,238,54,273,16,282,63,223,23,37,218,399,45,289,127,131,272,276,77,283,111,403,241,155,154,281,139,315,222,125,321,388,46,371,172,158,151,372,356,361,396,198,358,340,404,360,149,174,408,140,305,332,344,34,192,322,338,385,75,317,64,200,67,92,213,146,9,13,405,12,375,24,33,70,389,382,178,148,21,324,393,211,215,355,105,292,261,237,348,402,216,19,138,294,363,126,87,362,235,316,384,366,383,62,345,183,394,116,359,225,163,51,79,31,233,132,369,15,35,203,82,303,290,86,309,122,367,310,253];

    /* src\StatsModal.svelte generated by Svelte v3.47.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (204:0) {:else}
    function create_else_block_1$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Play daily to see your stats";
    			attr(div, "class", "text-center py-3 text-custom-line font-semibold");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (91:0) {#if maybeIsFirstTime}
    function create_if_block$4(ctx) {
    	let div0;
    	let t0;
    	let div10;
    	let div3;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let t4;
    	let div6;
    	let div4;
    	let t5;
    	let t6;
    	let div5;
    	let t8;
    	let div9;
    	let div7;

    	let t9_value = (/*played*/ ctx[5] > 0
    	? (/*wonCount*/ ctx[7] / /*played*/ ctx[5] * 100).toFixed(1)
    	: 0) + "" + "";

    	let t9;
    	let t10;
    	let t11;
    	let div8;
    	let t13;
    	let div17;
    	let div13;
    	let div11;
    	let t14_value = /*streaks*/ ctx[6].slice(-1)[0] + "" + "";
    	let t14;
    	let t15;
    	let div12;
    	let t17;
    	let div16;
    	let div14;
    	let t18_value = Math.max(.../*streaks*/ ctx[6]) + "" + "";
    	let t18;
    	let t19;
    	let div15;
    	let each_value = /*histogram*/ ctx[8];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div10 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			t1 = text(/*played*/ ctx[5]);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Played";
    			t4 = space();
    			div6 = element("div");
    			div4 = element("div");
    			t5 = text(/*wonCount*/ ctx[7]);
    			t6 = space();
    			div5 = element("div");
    			div5.textContent = "Won";
    			t8 = space();
    			div9 = element("div");
    			div7 = element("div");
    			t9 = text(t9_value);
    			t10 = text("%");
    			t11 = space();
    			div8 = element("div");
    			div8.textContent = "Win Rate";
    			t13 = space();
    			div17 = element("div");
    			div13 = element("div");
    			div11 = element("div");
    			t14 = text(t14_value);
    			t15 = space();
    			div12 = element("div");
    			div12.textContent = "Current Streak";
    			t17 = space();
    			div16 = element("div");
    			div14 = element("div");
    			t18 = text(t18_value);
    			t19 = space();
    			div15 = element("div");
    			div15.textContent = "Max Streak";
    			attr(div0, "class", "flex justify-between py-3");
    			attr(div1, "class", "text-xl font-semibold");
    			attr(div2, "class", "text-custom-line text-sm ");
    			attr(div3, "class", "flex-1");
    			attr(div4, "class", "text-xl font-semibold");
    			attr(div5, "class", "text-custom-line text-sm ");
    			attr(div6, "class", "flex-1");
    			attr(div7, "class", "text-xl font-semibold");
    			attr(div8, "class", "text-custom-line text-sm");
    			attr(div9, "class", "flex-1");
    			attr(div10, "class", "flex justify-between text-center w-full py-3");
    			attr(div11, "class", "text-xl font-semibold");
    			attr(div12, "class", "text-custom-line text-sm");
    			attr(div13, "class", "flex-1");
    			attr(div14, "class", "text-xl font-semibold");
    			attr(div15, "class", "text-custom-line text-sm");
    			attr(div16, "class", "flex-1");
    			attr(div17, "class", "flex justify-between text-center w-full py-3 pt-0");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert(target, t0, anchor);
    			insert(target, div10, anchor);
    			append(div10, div3);
    			append(div3, div1);
    			append(div1, t1);
    			append(div3, t2);
    			append(div3, div2);
    			append(div10, t4);
    			append(div10, div6);
    			append(div6, div4);
    			append(div4, t5);
    			append(div6, t6);
    			append(div6, div5);
    			append(div10, t8);
    			append(div10, div9);
    			append(div9, div7);
    			append(div7, t9);
    			append(div7, t10);
    			append(div9, t11);
    			append(div9, div8);
    			insert(target, t13, anchor);
    			insert(target, div17, anchor);
    			append(div17, div13);
    			append(div13, div11);
    			append(div11, t14);
    			append(div13, t15);
    			append(div13, div12);
    			append(div17, t17);
    			append(div17, div16);
    			append(div16, div14);
    			append(div14, t18);
    			append(div16, t19);
    			append(div16, div15);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*histogram, todaysScore, hasFinished, guessRef, isPrime, maxHistogram*/ 783) {
    				each_value = /*histogram*/ ctx[8];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*played*/ 32) set_data(t1, /*played*/ ctx[5]);
    			if (dirty & /*wonCount*/ 128) set_data(t5, /*wonCount*/ ctx[7]);

    			if (dirty & /*played, wonCount*/ 160 && t9_value !== (t9_value = (/*played*/ ctx[5] > 0
    			? (/*wonCount*/ ctx[7] / /*played*/ ctx[5] * 100).toFixed(1)
    			: 0) + "" + "")) set_data(t9, t9_value);

    			if (dirty & /*streaks*/ 64 && t14_value !== (t14_value = /*streaks*/ ctx[6].slice(-1)[0] + "" + "")) set_data(t14, t14_value);
    			if (dirty & /*streaks*/ 64 && t18_value !== (t18_value = Math.max(.../*streaks*/ ctx[6]) + "" + "")) set_data(t18, t18_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div10);
    			if (detaching) detach(t13);
    			if (detaching) detach(div17);
    		}
    	};
    }

    // (141:20) {:else}
    function create_else_block$3(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    // (133:38) 
    function create_if_block_2$3(ctx) {
    	let span0;
    	let t0_value = /*i*/ ctx[16] + 1 + "" + "";
    	let t0;
    	let t1;
    	let t2;
    	let span1;

    	return {
    		c() {
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = text("°");
    			t2 = space();
    			span1 = element("span");
    			toggle_class(span0, "font-semibold", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && /*hasFinished*/ ctx[1]);
    			toggle_class(span0, "text-custom-positive", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 != /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			toggle_class(span0, "text-custom-negative", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 == /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			attr(span1, "class", "text-custom-positive");
    		},
    		m(target, anchor) {
    			insert(target, span0, anchor);
    			append(span0, t0);
    			append(span0, t1);
    			insert(target, t2, anchor);
    			insert(target, span1, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*todaysScore, hasFinished*/ 3) {
    				toggle_class(span0, "font-semibold", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && /*hasFinished*/ ctx[1]);
    			}

    			if (dirty & /*todaysScore, guessRef, hasFinished*/ 11) {
    				toggle_class(span0, "text-custom-positive", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 != /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			}

    			if (dirty & /*todaysScore, guessRef, hasFinished*/ 11) {
    				toggle_class(span0, "text-custom-negative", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 == /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(span0);
    			if (detaching) detach(t2);
    			if (detaching) detach(span1);
    		}
    	};
    }

    // (116:20) {#if i === histogram.length - 1}
    function create_if_block_1$3(ctx) {
    	let svg;
    	let line0;
    	let line1;

    	return {
    		c() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr(line0, "x1", "18");
    			attr(line0, "y1", "6");
    			attr(line0, "x2", "6");
    			attr(line0, "y2", "18");
    			attr(line1, "x1", "6");
    			attr(line1, "y1", "6");
    			attr(line1, "x2", "18");
    			attr(line1, "y2", "18");
    			attr(svg, "class", "mx-auto");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "16");
    			attr(svg, "height", "16");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, line0);
    			append(svg, line1);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (94:8) {#each histogram as h, i}
    function create_each_block$2(ctx) {
    	let div4;
    	let div2;
    	let div1;
    	let div0;
    	let t0_value = (/*h*/ ctx[14] > 0 ? /*h*/ ctx[14] : " ") + "" + "";
    	let t0;
    	let t1;
    	let div3;
    	let t2;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[16] === /*histogram*/ ctx[8].length - 1) return create_if_block_1$3;
    		if (/*isPrime*/ ctx[2]) return create_if_block_2$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			if_block.c();
    			t2 = space();
    			attr(div0, "class", "h-full absolute text-center w-full py-1 text-xs ");
    			toggle_class(div0, "bg-custom-positive", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 != /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			toggle_class(div0, "bg-custom-negative", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] && 0 == /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			attr(div1, "class", "absolute bg-custom-mg w-6");
    			set_style(div1, "height", /*h*/ ctx[14] / /*maxHistogram*/ ctx[9] * 100 + "%", false);
    			attr(div2, "class", "h-32 relative w-9 flex justify-center items-end");
    			attr(div4, "class", "flex flex-col items-stretch ");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div2);
    			append(div2, div1);
    			append(div1, div0);
    			append(div0, t0);
    			append(div4, t1);
    			append(div4, div3);
    			if_block.m(div3, null);
    			append(div4, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*histogram*/ 256 && t0_value !== (t0_value = (/*h*/ ctx[14] > 0 ? /*h*/ ctx[14] : " ") + "" + "")) set_data(t0, t0_value);

    			if (dirty & /*todaysScore, guessRef, hasFinished*/ 11) {
    				toggle_class(div0, "bg-custom-positive", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] - 1 && 0 != /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			}

    			if (dirty & /*todaysScore, guessRef, hasFinished*/ 11) {
    				toggle_class(div0, "bg-custom-negative", /*i*/ ctx[16] == /*todaysScore*/ ctx[0] && 0 == /*guessRef*/ ctx[3] && /*hasFinished*/ ctx[1]);
    			}

    			if (dirty & /*histogram, maxHistogram*/ 768) {
    				set_style(div1, "height", /*h*/ ctx[14] / /*maxHistogram*/ ctx[9] * 100 + "%", false);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			if_block.d();
    		}
    	};
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*maybeIsFirstTime*/ ctx[4]) return create_if_block$4;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { userStats } = $$props;
    	let { config } = $$props;
    	let { todaysScore } = $$props;
    	let { hasFinished } = $$props;
    	let { daysSince } = $$props;
    	let maybeIsFirstTime = !1, played = 0, streaks = [], dayResults = [], wonCount = 0;
    	let { isPrime } = $$props;
    	let { guessRef } = $$props;
    	let histogram = [];
    	for (let e = 0; e < config.maxAttempts + 1; e++) histogram[e] = 0;
    	let maxHistogram = 0;

    	if (userStats.length > 0) {
    		maybeIsFirstTime = !0;
    		let lastId = -1;
    		let wentBackwards = false;

    		for (let e in userStats) {
    			if (true === userStats[e].hasFinished) {
    				++played;
    				let userStatId = userStats[e].id;

    				// In Dec 2022, the ids reset to 0. This was fixed in Jan 2023.
    				// When counting streaks, try to detect this to set the `daysWon` flags correctly
    				// User stats are in date order, not id order. So if the ids went backwards, we've hit our bug
    				if (lastId > userStatId) {
    					wentBackwards = true;
    				}

    				lastId = userStatId;

    				if (wentBackwards && userStatId < 30) {
    					userStatId += idOffset;
    				}

    				dayResults[userStatId] = userStats[e].gotCorrect ? 1 : 0;

    				if (true === userStats[e].gotCorrect) {
    					++wonCount;
    					++histogram[userStats[e].score - 1];

    					if (histogram[userStats[e].score - 1] > maxHistogram) {
    						maxHistogram = histogram[userStats[e].score - 1];
    					}
    				} else {
    					++histogram[config.maxAttempts];

    					if (histogram[config.maxAttempts] > maxHistogram) {
    						maxHistogram = histogram[config.maxAttempts];
    					}
    				}
    			}
    		}

    		// In Dec 2022, the ids reset to 0. This was fixed in Jan 2023 after about 26 days.
    		// If you had user stats for these "bad" ids (from the first month the game was live)
    		// it thought you already played and didnt let you play.
    		// For those cases, for the purposes of streak calculation, assume they would have gotten it right.
    		for (let i = 0; i < 26; i++) {
    			if (dayResults[i] !== undefined && // They played on the original "bad id" day
    			i <= daysSince && // The game with the "bad id" is not in the future
    			dayResults[i + idOffset] === undefined) {
    				dayResults[i + idOffset] = 1; // They did not play after the fix
    			}
    		}

    		// Fill in empty items (days they didnt play) with 0, so we can correctly calculate streaks.
    		// Needs to be done after the above
    		for (let i = 0; i < daysSince + 1 + idOffset; i++) {
    			if (dayResults[i] === undefined) {
    				dayResults[i] = 0;
    			}
    		}

    		streaks = dayResults.reduce((e, t) => (t ? e[e.length - 1]++ : e.push(0), e), [0]);
    	}

    	$$self.$$set = $$props => {
    		if ('userStats' in $$props) $$invalidate(10, userStats = $$props.userStats);
    		if ('config' in $$props) $$invalidate(11, config = $$props.config);
    		if ('todaysScore' in $$props) $$invalidate(0, todaysScore = $$props.todaysScore);
    		if ('hasFinished' in $$props) $$invalidate(1, hasFinished = $$props.hasFinished);
    		if ('daysSince' in $$props) $$invalidate(12, daysSince = $$props.daysSince);
    		if ('isPrime' in $$props) $$invalidate(2, isPrime = $$props.isPrime);
    		if ('guessRef' in $$props) $$invalidate(3, guessRef = $$props.guessRef);
    	};

    	return [
    		todaysScore,
    		hasFinished,
    		isPrime,
    		guessRef,
    		maybeIsFirstTime,
    		played,
    		streaks,
    		wonCount,
    		histogram,
    		maxHistogram,
    		userStats,
    		config,
    		daysSince
    	];
    }

    class StatsModal extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$6, create_fragment$7, safe_not_equal, {
    			userStats: 10,
    			config: 11,
    			todaysScore: 0,
    			hasFinished: 1,
    			daysSince: 12,
    			isPrime: 2,
    			guessRef: 3
    		});
    	}
    }

    /* src\TimeRemaining.svelte generated by Svelte v3.47.0 */

    function create_fragment$6(ctx) {
    	let div;
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*timeRemaining*/ ctx[0]);
    			attr(div, "class", "tracking-widest text-lg");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*timeRemaining*/ 1) set_data(t, /*timeRemaining*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let timeRemaining = "",
    		s = new Date(),
    		i = 3600 * (23 - s.getHours()) + 60 * (59 - s.getMinutes()) + (59 - s.getSeconds());

    	setInterval(
    		() => {
    			let e = Math.floor(i / 3600),
    				t = Math.floor((i - 3600 * e) / 60),
    				s = Math.floor(i % 60);

    			$$invalidate(0, timeRemaining = ("00" + e).slice(-2) + ":" + ("00" + t).slice(-2) + ":" + ("00" + s).slice(-2));
    			i--;
    			0 == e && 0 == t && 0 == s && location.reload(!0);
    		},
    		1000
    	);

    	return [timeRemaining];
    }

    class TimeRemaining extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});
    	}
    }

    /* src\GameResult.svelte generated by Svelte v3.47.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (72:0) {#if hasFinished}
    function create_if_block$3(ctx) {
    	let div2;
    	let p0;
    	let t0_value = /*Jt*/ ctx[6][/*guessRef*/ ctx[3]] + "" + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let p1;
    	let t3;
    	let t4;
    	let div1;
    	let button;
    	let t5;
    	let div5;
    	let div4;
    	let div3;
    	let t7;
    	let timeremaining;
    	let current;
    	let each_value = Array(/*config*/ ctx[1].maxAttempts);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function select_block_type_3(ctx, dirty) {
    		if (0 == /*guessRef*/ ctx[3]) return create_if_block_2$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*copiedMessageActive*/ ctx[5] && create_if_block_1$2();

    	button = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", /*onCopyToClipboard*/ ctx[7]);
    	timeremaining = new TimeRemaining({});

    	return {
    		c() {
    			div2 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			p1 = element("p");
    			if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "Next TMBG song in:";
    			t7 = space();
    			create_component(timeremaining.$$.fragment);
    			attr(p0, "class", "text-lg text-custom-line");
    			attr(div0, "class", "flex justify-center my-2");
    			attr(p1, "class", "py-1");
    			attr(div1, "class", "flex flex-col justify-center items-center pt-3");
    			attr(div2, "class", "text-center px-3");
    			attr(div3, "class", "text-center text-custom-line text-sm");
    			attr(div4, "class", "flex flex-col justify-center items-center mb-6 mx-3");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, p0);
    			append(p0, t0);
    			append(div2, t1);
    			append(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append(div2, t2);
    			append(div2, p1);
    			if_block0.m(p1, null);
    			append(div2, t3);
    			if (if_block1) if_block1.m(div2, null);
    			append(div2, t4);
    			append(div2, div1);
    			mount_component(button, div1, null);
    			insert(target, t5, anchor);
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div3);
    			append(div4, t7);
    			mount_component(timeremaining, div4, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty & /*guessRef*/ 8) && t0_value !== (t0_value = /*Jt*/ ctx[6][/*guessRef*/ ctx[3]] + "" + "")) set_data(t0, t0_value);

    			if (dirty & /*userGuesses, undefined, config*/ 3) {
    				each_value = Array(/*config*/ ctx[1].maxAttempts);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(p1, null);
    				}
    			}

    			if (/*copiedMessageActive*/ ctx[5]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$2();
    					if_block1.c();
    					if_block1.m(div2, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(timeremaining.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(timeremaining.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			destroy_each(each_blocks, detaching);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    			if (detaching) detach(t5);
    			if (detaching) detach(div5);
    			destroy_component(timeremaining);
    		}
    	};
    }

    // (92:16) {:else}
    function create_else_block_4$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-4 h-1 m-0.5 bg-custom-fg");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (80:16) {#if i <= userGuesses.length - 1}
    function create_if_block_4$2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*userGuesses*/ ctx[0][/*i*/ ctx[13]].isSkipped) return create_if_block_5$2;
    		if (/*userGuesses*/ ctx[0][/*i*/ ctx[13]].isCorrect || /*userGuesses*/ ctx[0][/*i*/ ctx[13]].isSkipped) return create_if_block_6$1;
    		return create_else_block_3$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (89:20) {:else}
    function create_else_block_3$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-4 h-1 m-0.5 bg-custom-negative");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (83:83) 
    function create_if_block_6$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*userGuesses*/ ctx[0][/*i*/ ctx[13]].isCorrect) return create_if_block_7$1;
    		return create_else_block_2$1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (81:20) {#if userGuesses[i].isSkipped}
    function create_if_block_5$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-4 h-1 m-0.5 bg-custom-mg");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (86:24) {:else}
    function create_else_block_2$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text(undefined);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (84:24) {#if userGuesses[i].isCorrect}
    function create_if_block_7$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-4 h-1 m-0.5 bg-custom-positive");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (79:12) {#each Array(config.maxAttempts) as jt, i}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[13] <= /*userGuesses*/ ctx[0].length - 1) return create_if_block_4$2;
    		return create_else_block_4$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (103:12) {:else}
    function create_else_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*isPrime*/ ctx[4]) return create_if_block_3$2;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (100:12) {#if 0 == guessRef}
    function create_if_block_2$2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("You didn't get today's TMBG Heardle. Better luck tomorrow! 💎");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (109:16) {:else}
    function create_else_block_1$1(ctx) {
    	let t0;
    	let t1_value = /*userGuesses*/ ctx[0].length * /*config*/ ctx[1].attemptInterval / 1e3 + "" + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			t0 = text("You got today's TMBG Heardle within the first ");
    			t1 = text(t1_value);
    			t2 = text(" seconds.");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*userGuesses, config*/ 3 && t1_value !== (t1_value = /*userGuesses*/ ctx[0].length * /*config*/ ctx[1].attemptInterval / 1e3 + "" + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (105:16) {#if isPrime}
    function create_if_block_3$2(ctx) {
    	let t0;
    	let t1_value = /*config*/ ctx[1].attemptIntervalAlt[/*config*/ ctx[1].length - 1] / 1e3 + "" + "";
    	let t1;
    	let t2;

    	let t3_value = (/*config*/ ctx[1].attemptIntervalAlt[/*config*/ ctx[1].length - 1] / 1e3 > 1
    	? "s"
    	: "") + "";

    	let t3;
    	let t4;

    	return {
    		c() {
    			t0 = text("You got today's TMBG Heardle within ");
    			t1 = text(t1_value);
    			t2 = text("\r\n                    second");
    			t3 = text(t3_value);
    			t4 = text(".");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, t2, anchor);
    			insert(target, t3, anchor);
    			insert(target, t4, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*config*/ 2 && t1_value !== (t1_value = /*config*/ ctx[1].attemptIntervalAlt[/*config*/ ctx[1].length - 1] / 1e3 + "" + "")) set_data(t1, t1_value);

    			if (dirty & /*config*/ 2 && t3_value !== (t3_value = (/*config*/ ctx[1].attemptIntervalAlt[/*config*/ ctx[1].length - 1] / 1e3 > 1
    			? "s"
    			: "") + "")) set_data(t3, t3_value);
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(t2);
    			if (detaching) detach(t3);
    			if (detaching) detach(t4);
    		}
    	};
    }

    // (118:8) {#if copiedMessageActive}
    function create_if_block_1$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Copied to clipboard!";
    			attr(div, "class", "tracking-widest uppercase text-xs text-custom-line p-3 pb-0 text-center");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (124:12) <Button primary={true} on:click={onCopyToClipboard}>
    function create_default_slot$3(ctx) {
    	let t;
    	let svg;
    	let circle0;
    	let circle1;
    	let circle2;
    	let line0;
    	let line1;

    	return {
    		c() {
    			t = text("Share\r\n                ");
    			svg = svg_element("svg");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr(circle0, "cx", "18");
    			attr(circle0, "cy", "5");
    			attr(circle0, "r", "3");
    			attr(circle1, "cx", "6");
    			attr(circle1, "cy", "12");
    			attr(circle1, "r", "3");
    			attr(circle2, "cx", "18");
    			attr(circle2, "cy", "19");
    			attr(circle2, "r", "3");
    			attr(line0, "x1", "8.59");
    			attr(line0, "y1", "13.51");
    			attr(line0, "x2", "15.42");
    			attr(line0, "y2", "17.49");
    			attr(line1, "x1", "15.41");
    			attr(line1, "y1", "6.51");
    			attr(line1, "x2", "8.59");
    			attr(line1, "y2", "10.49");
    			attr(svg, "class", "inline-block ml-2");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "18");
    			attr(svg, "height", "18");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    			insert(target, svg, anchor);
    			append(svg, circle0);
    			append(svg, circle1);
    			append(svg, circle2);
    			append(svg, line0);
    			append(svg, line1);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(t);
    			if (detaching) detach(svg);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*hasFinished*/ ctx[2] && create_if_block$3(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (/*hasFinished*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*hasFinished*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { userGuesses } = $$props;
    	let { currentHeardle } = $$props;
    	let { config } = $$props;
    	let { hasFinished } = $$props;
    	let { gotCorrect } = $$props;
    	let { guessRef } = $$props;
    	let { isPrime } = $$props;
    	let copiedMessageActive = false;
    	const Jt = ["0", "1", "2", "3", "4", "5", "6"];
    	Array(config.maxAttempts);

    	function onCopyToClipboard() {
    		let e = "TMBG Heardle #" + (currentHeardle.id + 1), t = "";

    		gotCorrect
    		? userGuesses.length < config.maxAttempts / 3
    			? t += "🔊"
    			: userGuesses.length < config.maxAttempts / 3 * 2
    				? t += "🔉"
    				: userGuesses.length <= config.maxAttempts && (t += "🔈")
    		: t += "🔇";

    		for (let e = 0; e < config.maxAttempts; e++) userGuesses.length > e
    		? 1 == userGuesses[e].isCorrect
    			? t += "🟩"
    			: 1 == userGuesses[e].isSkipped ? t += "⬛️" : t += "🟥"
    		: t += "⬜️";

    		let o = e + "\n\n" + t + "\n\nhttps://tmbg-heardle.glitch.me/";

    		if (!navigator.share || !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent) || (/Firefox/i).test(navigator.userAgent)) {
    			if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    				addEvent("clickShareClipboard", { name: "clickShareClipboard" });
    				$$invalidate(5, copiedMessageActive = true);

    				setTimeout(
    					() => {
    						$$invalidate(5, copiedMessageActive = false);
    					},
    					2e3
    				);

    				return navigator.clipboard.writeText(o);
    			} else {
    				return Promise.reject("There was a problem copying your result to the clipboard");
    			}
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('userGuesses' in $$props) $$invalidate(0, userGuesses = $$props.userGuesses);
    		if ('currentHeardle' in $$props) $$invalidate(8, currentHeardle = $$props.currentHeardle);
    		if ('config' in $$props) $$invalidate(1, config = $$props.config);
    		if ('hasFinished' in $$props) $$invalidate(2, hasFinished = $$props.hasFinished);
    		if ('gotCorrect' in $$props) $$invalidate(9, gotCorrect = $$props.gotCorrect);
    		if ('guessRef' in $$props) $$invalidate(3, guessRef = $$props.guessRef);
    		if ('isPrime' in $$props) $$invalidate(4, isPrime = $$props.isPrime);
    	};

    	return [
    		userGuesses,
    		config,
    		hasFinished,
    		guessRef,
    		isPrime,
    		copiedMessageActive,
    		Jt,
    		onCopyToClipboard,
    		currentHeardle,
    		gotCorrect
    	];
    }

    class GameResult extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {
    			userGuesses: 0,
    			currentHeardle: 8,
    			config: 1,
    			hasFinished: 2,
    			gotCorrect: 9,
    			guessRef: 3,
    			isPrime: 4
    		});
    	}
    }

    /* src\LoadbarSound.svelte generated by Svelte v3.47.0 */

    function create_fragment$4(ctx) {
    	let div;
    	let i;

    	return {
    		c() {
    			div = element("div");
    			i = element("i");
    			attr(i, "class", "gg-loadbar-sound svelte-15swa4o");
    			toggle_class(i, "musicIsPlaying", /*musicIsPlaying*/ ctx[0]);
    			attr(div, "class", "scale-150 transform relative");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, i);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*musicIsPlaying*/ 1) {
    				toggle_class(i, "musicIsPlaying", /*musicIsPlaying*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { musicIsPlaying } = $$props;

    	$$self.$$set = $$props => {
    		if ('musicIsPlaying' in $$props) $$invalidate(0, musicIsPlaying = $$props.musicIsPlaying);
    	};

    	return [musicIsPlaying];
    }

    class LoadbarSound extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, { musicIsPlaying: 0 });
    	}
    }

    /* src\EmptyDiv.svelte generated by Svelte v3.47.0 */

    function create_fragment$3(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    class EmptyDiv extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$3, safe_not_equal, {});
    	}
    }

    /* src\MusicPlayer.svelte generated by Svelte v3.47.0 */

    const { document: document_1$1, window: window_1$1 } = globals;

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[32] = list[i];
    	child_ctx[34] = i;
    	return child_ctx;
    }

    // (307:0) {:else}
    function create_else_block_4(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_8, create_else_block_5];
    	const if_blocks = [];

    	function select_block_type_5(ctx, dirty) {
    		if (/*S*/ ctx[17]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_5(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "text-sm text-center text-custom-line p-6");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_5(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    // (143:0) {#if playerIsReady}
    function create_if_block$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*songIsBlocked*/ ctx[13]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (331:8) {:else}
    function create_else_block_5(ctx) {
    	let emptydiv;
    	let t0;
    	let p;
    	let current;
    	emptydiv = new EmptyDiv({});

    	return {
    		c() {
    			create_component(emptydiv.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "loading player";
    		},
    		m(target, anchor) {
    			mount_component(emptydiv, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, p, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(emptydiv.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emptydiv.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(emptydiv, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(p);
    		}
    	};
    }

    // (310:8) {#if S}
    function create_if_block_8(ctx) {
    	let p;
    	let t1;
    	let div;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", /*click_handler*/ ctx[22]);

    	return {
    		c() {
    			p = element("p");
    			p.textContent = "There was an error loading the player. Please reload and try again.";
    			t1 = space();
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr(p, "class", "mb-3");
    			attr(div, "class", "flex justify-center");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_component(button);
    		}
    	};
    }

    // (314:16) <Button on:click={() => window.location.reload()}>
    function create_default_slot_1$1(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "width", "24");
    			attr(svg, "height", "24");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "fill", "none");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(svg, "stroke-linecap", "round");
    			attr(svg, "stroke-linejoin", "round");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (274:4) {:else}
    function create_else_block_3(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let p;
    	let t2;
    	let if_block = /*gameState*/ ctx[4].gameIsActive && create_if_block_7(ctx);

    	return {
    		c() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"></path></svg>`;
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Oh no! Seems like today's track is unavailable on SoundCloud in your location";
    			t2 = space();
    			if (if_block) if_block.c();
    			attr(div0, "class", "mr-3");
    			attr(p, "class", "text-sm ");
    			attr(div2, "class", "flex items-center");
    			attr(div3, "class", "p-3 mb-3 bg-custom-mg rounded-sm");
    			attr(div4, "class", "max-w-screen-sm w-full mx-auto px-3 flex-col");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t0);
    			append(div2, div1);
    			append(div1, p);
    			append(div1, t2);
    			if (if_block) if_block.m(div1, null);
    		},
    		p(ctx, dirty) {
    			if (/*gameState*/ ctx[4].gameIsActive) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (145:4) {#if !songIsBlocked}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let t2;
    	let div12;
    	let div11;
    	let div10;
    	let div9;
    	let div6;
    	let div5;
    	let t3_value = formatMs(/*currentPosition*/ ctx[15]) + "" + "";
    	let t3;
    	let t4;
    	let div7;
    	let button;
    	let t5;
    	let div8;

    	let t6_value = formatMs(/*gameIsActive*/ ctx[10]
    	? /*gameState*/ ctx[4].isPrime
    		? /*attemptIntervalAlt*/ ctx[8].slice(-1)[0]
    		: /*config*/ ctx[2].maxAttempts * /*config*/ ctx[2].attemptInterval
    	: /*trackDuration*/ ctx[3]) + "" + "";

    	let t6;
    	let current;
    	let if_block0 = !/*x*/ ctx[16] && 1 == /*currentAttempt*/ ctx[0] && create_if_block_6();

    	function select_block_type_2(ctx, dirty) {
    		if (/*gameState*/ ctx[4].isPrime) return create_if_block_3$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block1 = current_block_type(ctx);

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("click", function () {
    		if (is_function(/*musicIsPlaying*/ ctx[9]
    		? /*scPause*/ ctx[6]()
    		: /*scPlay*/ ctx[5]())) (/*musicIsPlaying*/ ctx[9]
    		? /*scPause*/ ctx[6]()
    		: /*scPlay*/ ctx[5]()).apply(this, arguments);
    	});

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t1 = space();
    			if_block1.c();
    			t2 = space();
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div7 = element("div");
    			create_component(button.$$.fragment);
    			t5 = space();
    			div8 = element("div");
    			t6 = text(t6_value);
    			attr(div0, "class", "h-full absolute bg-custom-positive");
    			set_style(div0, "width", /*progressBarPercent*/ ctx[14] + "%", false);
    			attr(div1, "class", "h-full absolute bg-custom-mg overflow-hidden");
    			set_style(div1, "width", (/*gameIsActive*/ ctx[10] ? /*l*/ ctx[12] : "100") + "%", false);
    			attr(div2, "class", "h-3 w-full relative overflow-hidden ");
    			attr(div3, "class", "max-w-screen-sm w-full mx-auto px-3 flex-col");
    			attr(div4, "class", "border-t border-custom-line");
    			attr(div6, "class", "flex items-center");
    			attr(div7, "class", "flex justify-center items-center p-1");
    			attr(div9, "class", "flex justify-between items-center");
    			attr(div10, "class", "px-3 ");
    			attr(div11, "class", "max-w-screen-sm w-full mx-auto flex-col");
    			attr(div12, "class", "border-t border-custom-line");
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div1);
    			append(div1, div0);
    			append(div2, t1);
    			if_block1.m(div2, null);
    			insert(target, t2, anchor);
    			insert(target, div12, anchor);
    			append(div12, div11);
    			append(div11, div10);
    			append(div10, div9);
    			append(div9, div6);
    			append(div6, div5);
    			append(div5, t3);
    			append(div9, t4);
    			append(div9, div7);
    			mount_component(button, div7, null);
    			append(div9, t5);
    			append(div9, div8);
    			append(div8, t6);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!/*x*/ ctx[16] && 1 == /*currentAttempt*/ ctx[0]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_6();
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*progressBarPercent*/ 16384) {
    				set_style(div0, "width", /*progressBarPercent*/ ctx[14] + "%", false);
    			}

    			if (dirty[0] & /*gameIsActive, l*/ 5120) {
    				set_style(div1, "width", (/*gameIsActive*/ ctx[10] ? /*l*/ ctx[12] : "100") + "%", false);
    			}

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			}

    			if ((!current || dirty[0] & /*currentPosition*/ 32768) && t3_value !== (t3_value = formatMs(/*currentPosition*/ ctx[15]) + "" + "")) set_data(t3, t3_value);
    			const button_changes = {};

    			if (dirty[0] & /*musicIsPlaying*/ 512 | dirty[1] & /*$$scope*/ 128) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if ((!current || dirty[0] & /*gameIsActive, gameState, attemptIntervalAlt, config, trackDuration*/ 1308) && t6_value !== (t6_value = formatMs(/*gameIsActive*/ ctx[10]
    			? /*gameState*/ ctx[4].isPrime
    				? /*attemptIntervalAlt*/ ctx[8].slice(-1)[0]
    				: /*config*/ ctx[2].maxAttempts * /*config*/ ctx[2].attemptInterval
    			: /*trackDuration*/ ctx[3]) + "" + "")) set_data(t6, t6_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div4);
    			if_block1.d();
    			if (detaching) detach(t2);
    			if (detaching) detach(div12);
    			destroy_component(button);
    		}
    	};
    }

    // (296:24) {#if gameState.gameIsActive}
    function create_if_block_7(ctx) {
    	let p;
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let t2;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("We're really sorry. The answer is ");
    			a = element("a");
    			t1 = text("here");
    			t2 = text(", though, if you\r\n                                want to maintain your streak.");
    			attr(a, "href", a_href_value = /*currentHeardle*/ ctx[1].url);
    			attr(p, "class", "text-xs text-custom-line pt-1");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, a);
    			append(a, t1);
    			append(p, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*currentHeardle*/ 2 && a_href_value !== (a_href_value = /*currentHeardle*/ ctx[1].url)) {
    				attr(a, "href", a_href_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (149:8) {#if !x && 1 == currentAttempt}
    function create_if_block_6(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");

    			div.innerHTML = `<p>Turn up the volume and tap to start the track!</p> 
                <svg class="mt-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>`;

    			attr(div, "class", "text-center p-3 flex flex-col items-center text-sm text-custom-line");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (199:20) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	function select_block_type_3(ctx, dirty) {
    		if (/*gameIsActive*/ ctx[10]) return create_if_block_5$1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "flex w-full h-full absolute justify-between");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    		}
    	};
    }

    // (178:20) {#if gameState.isPrime}
    function create_if_block_3$1(ctx) {
    	let div;
    	let if_block = /*gameIsActive*/ ctx[10] && create_if_block_4$1(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr(div, "class", "w-full h-full absolute");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (/*gameIsActive*/ ctx[10]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (207:28) {:else}
    function create_else_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_2 = Array(Math.floor(/*trackDuration*/ ctx[3] / /*config*/ ctx[2].attemptInterval));
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*trackDuration, config*/ 12) {
    				each_value_2 = Array(Math.floor(/*trackDuration*/ ctx[3] / /*config*/ ctx[2].attemptInterval));
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2();
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (202:28) {#if gameIsActive}
    function create_if_block_5$1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = Array(/*config*/ ctx[2].maxAttempts + 1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*config*/ 4) {
    				each_value_1 = Array(/*config*/ ctx[2].maxAttempts + 1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1();
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (209:32) {#each Array(Math.floor(trackDuration / config.attemptInterval)) as something, i}
    function create_each_block_2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "bg-custom-bg w-px h-full");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (203:32) {#each Array(config.maxAttempts + 1) as something, i}
    function create_each_block_1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "bg-custom-bg w-px h-full");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (183:28) {#if gameIsActive}
    function create_if_block_4$1(ctx) {
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let each_value = /*attemptIntervalAlt*/ ctx[8];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div0 = element("div");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			attr(div0, "class", "bg-custom-line w-px h-full absolute right-0");
    			attr(div1, "class", "bg-custom-mg w-px h-full absolute right-0");
    		},
    		m(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, t1, anchor);
    			insert(target, div1, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*currentAttempt2, attemptIntervalAlt*/ 384) {
    				each_value = /*attemptIntervalAlt*/ ctx[8];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t1.parentNode, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div0);
    			if (detaching) detach(t0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t1);
    			if (detaching) detach(div1);
    		}
    	};
    }

    // (186:32) {#each attemptIntervalAlt as a_i, i}
    function create_each_block(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "w-px h-full absolute");
    			toggle_class(div, "bg-custom-bg", /*i*/ ctx[34] < /*currentAttempt2*/ ctx[7] - 1);
    			toggle_class(div, "bg-custom-mg", /*i*/ ctx[34] > /*currentAttempt2*/ ctx[7] - 1);
    			toggle_class(div, "bg-custom-line", /*i*/ ctx[34] == /*currentAttempt2*/ ctx[7] - 1);
    			set_style(div, "left", /*attemptIntervalAlt*/ ctx[8][/*i*/ ctx[34]] / /*attemptIntervalAlt*/ ctx[8].slice(-1)[0] * 100 + "%", false);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*currentAttempt2*/ 128) {
    				toggle_class(div, "bg-custom-bg", /*i*/ ctx[34] < /*currentAttempt2*/ ctx[7] - 1);
    			}

    			if (dirty[0] & /*currentAttempt2*/ 128) {
    				toggle_class(div, "bg-custom-mg", /*i*/ ctx[34] > /*currentAttempt2*/ ctx[7] - 1);
    			}

    			if (dirty[0] & /*currentAttempt2*/ 128) {
    				toggle_class(div, "bg-custom-line", /*i*/ ctx[34] == /*currentAttempt2*/ ctx[7] - 1);
    			}

    			if (dirty[0] & /*attemptIntervalAlt*/ 256) {
    				set_style(div, "left", /*attemptIntervalAlt*/ ctx[8][/*i*/ ctx[34]] / /*attemptIntervalAlt*/ ctx[8].slice(-1)[0] * 100 + "%", false);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (241:36) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    			attr(div, "class", "ml-1 relative z-10");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (235:36) {#if musicIsPlaying}
    function create_if_block_2$1(ctx) {
    	let div;
    	let loadbarsound;
    	let current;

    	loadbarsound = new LoadbarSound({
    			props: {
    				musicIsPlaying: /*musicIsPlaying*/ ctx[9]
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(loadbarsound.$$.fragment);
    			attr(div, "class", "relative z-10");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(loadbarsound, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const loadbarsound_changes = {};
    			if (dirty[0] & /*musicIsPlaying*/ 512) loadbarsound_changes.musicIsPlaying = /*musicIsPlaying*/ ctx[9];
    			loadbarsound.$set(loadbarsound_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loadbarsound.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadbarsound.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(loadbarsound);
    		}
    	};
    }

    // (230:28) <Button on:click={musicIsPlaying ? scPause() : scPlay()}>
    function create_default_slot$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_4(ctx, dirty) {
    		if (/*musicIsPlaying*/ ctx[9]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_4(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "flex justify-center items-center text-custom-fg h-14 w-14 border-2 rounded-full relative overflow-hidden");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_4(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$2, create_else_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*playerIsReady*/ ctx[11]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			script = element("script");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			if (!src_url_equal(script.src, script_src_value = "https://w.soundcloud.com/player/api.js")) attr(script, "src", script_src_value);
    			attr(div1, "class", "hidden");
    		},
    		m(target, anchor) {
    			append(document_1$1.head, script);
    			insert(target, t0, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, t1, anchor);
    			insert(target, div1, anchor);
    			append(div1, div0);
    			/*div0_binding*/ ctx[23](div0);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window_1$1, "load", /*e19*/ ctx[19]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(t1.parentNode, t1);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			detach(script);
    			if (detaching) detach(t0);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(t1);
    			if (detaching) detach(div1);
    			/*div0_binding*/ ctx[23](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function formatMs(e) {
    	var t = Math.floor(e / 6e4), n = (e % 6e4 / 1e3).toFixed(0);
    	return t + ":" + (n < 10 ? "0" : "") + n;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let /*r*/
    		musicIsPlaying,
    		gameIsActive,
    		playerIsReady,
    		currentAttempt2,
    		attemptIntervalAlt,
    		l,
    		currentAttemptIntervalAlt;

    	const dispatch = createEventDispatcher();
    	let { currentAttempt } = $$props;
    	let { currentHeardle } = $$props;
    	let { config } = $$props;
    	let { trackDuration = 0 } = $$props;
    	let { gameState } = $$props;
    	let songIsBlocked = false;
    	var y;

    	let progressBarPercent = 0,
    		currentPosition = 0,
    		k = !1,
    		_ = !1,
    		x = !1,
    		b = !1,
    		S = !1;

    	const togglePlayState = () => {
    		y.toggle();
    	};

    	const scPlay = () => {
    		(y.seekTo(0), y.play());
    	};

    	const scPause = () => {
    		(y.seekTo(0), y.pause());
    	};

    	const resetAndPlay = () => {
    		(y.seekTo(0), y.play());
    	};

    	function onMusicIsPlayingChange(e) {
    		console.log("musicIsPlaying: " + e);
    		dispatch("updatePlayerState", { musicIsPlaying: e });
    	}

    	let scWidgetDiv;

    	function T() {
    		(y = SC.Widget("soundcloud" + currentHeardle.id)).bind(SC.Widget.Events.READY, function () {
    			(y.getCurrentSound(function (e) {
    				("BLOCK" === e.policy && $$invalidate(13, songIsBlocked = !0), dispatch("updateSong", { currentSong: e }));
    			}), y.bind(SC.Widget.Events.PAUSE, function () {
    				onMusicIsPlayingChange(!1);
    			}), y.bind(SC.Widget.Events.PLAY, function () {
    				(b || (addEvent("startGame", { name: "startGame" }), addEvent("startGame#" + currentHeardle.id, { name: "startGame" }), b = !0), onMusicIsPlayingChange(!0), $$invalidate(16, x = !0));
    			}), y.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
    				($$invalidate(15, currentPosition = e.currentPosition), 1 == gameIsActive
    				? gameState.isPrime
    					? ($$invalidate(14, progressBarPercent = currentPosition / currentAttemptIntervalAlt * 100), currentPosition > currentAttemptIntervalAlt && scPause())
    					: ($$invalidate(14, progressBarPercent = currentPosition / (currentAttempt * config.attemptInterval) * 100), currentPosition > currentAttempt * config.attemptInterval && scPause())
    				: ($$invalidate(14, progressBarPercent = currentPosition / trackDuration * 100), currentPosition > trackDuration && scPause()));
    			}));
    		});
    	}

    	function e19() {
    		(k = !0, _ && (setTimeout(
    			() => {
    				$$invalidate(17, S = !0);
    			},
    			6e3
    		), T()));
    	}

    	onMount(() => {
    		const e = document.createElement("iframe");
    		e.name = currentHeardle.id;
    		e.id = "soundcloud" + currentHeardle.id;
    		e.allow = "autoplay";
    		e.height = 0;
    		e.src = "https://w.soundcloud.com/player/?url=" + currentHeardle.url + "&cache=" + currentHeardle.id;
    		scWidgetDiv.appendChild(e);
    		_ = !0;

    		k && (setTimeout(
    			() => {
    				$$invalidate(17, S = !0);
    			},
    			6e3
    		), T());
    	});

    	const click_handler = () => window.location.reload();

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			scWidgetDiv = $$value;
    			$$invalidate(18, scWidgetDiv);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('currentAttempt' in $$props) $$invalidate(0, currentAttempt = $$props.currentAttempt);
    		if ('currentHeardle' in $$props) $$invalidate(1, currentHeardle = $$props.currentHeardle);
    		if ('config' in $$props) $$invalidate(2, config = $$props.config);
    		if ('trackDuration' in $$props) $$invalidate(3, trackDuration = $$props.trackDuration);
    		if ('gameState' in $$props) $$invalidate(4, gameState = $$props.gameState);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*gameState*/ 16) {
    			$$invalidate(9, musicIsPlaying = gameState.musicIsPlaying);
    		}

    		if ($$self.$$.dirty[0] & /*gameState*/ 16) {
    			$$invalidate(10, gameIsActive = gameState.gameIsActive);
    		}

    		if ($$self.$$.dirty[0] & /*gameState*/ 16) {
    			$$invalidate(11, playerIsReady = gameState.playerIsReady);
    		}

    		if ($$self.$$.dirty[0] & /*currentAttempt*/ 1) {
    			$$invalidate(7, currentAttempt2 = currentAttempt);
    		}

    		if ($$self.$$.dirty[0] & /*config*/ 4) {
    			$$invalidate(8, attemptIntervalAlt = config.attemptIntervalAlt);
    		}

    		if ($$self.$$.dirty[0] & /*gameState, attemptIntervalAlt, currentAttempt2, currentAttempt, config*/ 405) {
    			$$invalidate(12, l = gameState.isPrime
    			? attemptIntervalAlt[currentAttempt2 - 1] / attemptIntervalAlt.slice(-1)[0] * 100
    			: currentAttempt / config.maxAttempts * 100);
    		}

    		if ($$self.$$.dirty[0] & /*attemptIntervalAlt, currentAttempt2*/ 384) {
    			currentAttemptIntervalAlt = attemptIntervalAlt[currentAttempt2 - 1];
    		}
    	};

    	return [
    		currentAttempt,
    		currentHeardle,
    		config,
    		trackDuration,
    		gameState,
    		scPlay,
    		scPause,
    		currentAttempt2,
    		attemptIntervalAlt,
    		musicIsPlaying,
    		gameIsActive,
    		playerIsReady,
    		l,
    		songIsBlocked,
    		progressBarPercent,
    		currentPosition,
    		x,
    		S,
    		scWidgetDiv,
    		e19,
    		togglePlayState,
    		resetAndPlay,
    		click_handler,
    		div0_binding
    	];
    }

    class MusicPlayer extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				currentAttempt: 0,
    				currentHeardle: 1,
    				config: 2,
    				trackDuration: 3,
    				gameState: 4,
    				togglePlayState: 20,
    				scPlay: 5,
    				scPause: 6,
    				resetAndPlay: 21
    			},
    			null,
    			[-1, -1]
    		);
    	}

    	get togglePlayState() {
    		return this.$$.ctx[20];
    	}

    	get scPlay() {
    		return this.$$.ctx[5];
    	}

    	get scPause() {
    		return this.$$.ctx[6];
    	}

    	get resetAndPlay() {
    		return this.$$.ctx[21];
    	}
    }

    var autoComplete_minExports = {};
    var autoComplete_min = {
      get exports(){ return autoComplete_minExports; },
      set exports(v){ autoComplete_minExports = v; },
    };

    (function (module, exports) {
    	var t;t=function(){function e(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function t(t){for(var n=1;n<arguments.length;n++){var i=null!=arguments[n]?arguments[n]:{};n%2?e(Object(i),!0).forEach((function(e){r(t,e,i[e]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):e(Object(i)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e));}));}return t}function n(e){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(e)}function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e){return function(e){if(Array.isArray(e))return s(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||o(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function o(e,t){if(e){if("string"==typeof e)return s(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?s(e,t):void 0}}function s(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var u=function(e){return "string"==typeof e?document.querySelector(e):e()},a=function(e,t){var n="string"==typeof e?document.createElement(e):e;for(var r in t){var i=t[r];if("inside"===r)i.append(n);else if("dest"===r)u(i[0]).insertAdjacentElement(i[1],n);else if("around"===r){var o=i;o.parentNode.insertBefore(n,o),n.append(o),null!=o.getAttribute("autofocus")&&o.focus();}else r in n?n[r]=i:n.setAttribute(r,i);}return n},c=function(e,t){return e=String(e).toLowerCase(),t?e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").normalize("NFC"):e},l=function(e,n){return a("mark",t({innerHTML:e},"string"==typeof n&&{class:n})).outerHTML},f=function(e,t){t.input.dispatchEvent(new CustomEvent(e,{bubbles:!0,detail:t.feedback,cancelable:!0}));},p=function(e,t,n){var r=n||{},i=r.mode,o=r.diacritics,s=r.highlight,u=c(t,o);if(t=String(t),e=c(e,o),"loose"===i){var a=(e=e.replace(/ /g,"")).length,f=0,p=Array.from(t).map((function(t,n){return f<a&&u[n]===e[f]&&(t=s?l(t,s):t,f++),t})).join("");if(f===a)return p}else {var d=u.indexOf(e);if(~d)return e=t.substring(d,d+e.length),d=s?t.replace(e,l(e,s)):t}},d=function(e,t){return new Promise((function(n,r){var i;return (i=e.data).cache&&i.store?n():new Promise((function(e,n){return "function"==typeof i.src?i.src(t).then(e,n):e(i.src)})).then((function(t){try{return e.feedback=i.store=t,f("response",e),n()}catch(e){return r(e)}}),r)}))},h=function(e,t){var n=t.data,r=t.searchEngine,i=[];n.store.forEach((function(s,u){var a=function(n){var o=n?s[n]:s,u="function"==typeof r?r(e,o):p(e,o,{mode:r,diacritics:t.diacritics,highlight:t.resultItem.highlight});if(u){var a={match:u,value:s};n&&(a.key=n),i.push(a);}};if(n.keys){var c,l=function(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=o(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,i=function(){};return {s:i,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,u=!0,a=!1;return {s:function(){n=n.call(e);},n:function(){var e=n.next();return u=e.done,e},e:function(e){a=!0,s=e;},f:function(){try{u||null==n.return||n.return();}finally{if(a)throw s}}}}(n.keys);try{for(l.s();!(c=l.n()).done;)a(c.value);}catch(e){l.e(e);}finally{l.f();}}else a();})),n.filter&&(i=n.filter(i));var s=i.slice(0,t.resultsList.maxResults);t.feedback={query:e,matches:i,results:s},f("results",t);},m="aria-expanded",b="aria-activedescendant",y="aria-selected",v=function(e,n){e.feedback.selection=t({index:n},e.feedback.results[n]);},g=function(e){e.isOpen||((e.wrapper||e.input).setAttribute(m,!0),e.list.removeAttribute("hidden"),e.isOpen=!0,f("open",e));},w=function(e){e.isOpen&&((e.wrapper||e.input).setAttribute(m,!1),e.input.setAttribute(b,""),e.list.setAttribute("hidden",""),e.isOpen=!1,f("close",e));},O=function(e,t){var n=t.resultItem,r=t.list.getElementsByTagName(n.tag),o=!!n.selected&&n.selected.split(" ");if(t.isOpen&&r.length){var s,u,a=t.cursor;e>=r.length&&(e=0),e<0&&(e=r.length-1),t.cursor=e,a>-1&&(r[a].removeAttribute(y),o&&(u=r[a].classList).remove.apply(u,i(o))),r[e].setAttribute(y,!0),o&&(s=r[e].classList).add.apply(s,i(o)),t.input.setAttribute(b,r[t.cursor].id),t.list.scrollTop=r[e].offsetTop-t.list.clientHeight+r[e].clientHeight+5,t.feedback.cursor=t.cursor,v(t,e),f("navigate",t);}},A=function(e){O(e.cursor+1,e);},k=function(e){O(e.cursor-1,e);},L=function(e,t,n){(n=n>=0?n:e.cursor)<0||(e.feedback.event=t,v(e,n),f("selection",e),w(e));};function j(e,n){var r=this;return new Promise((function(i,o){var s,u;return s=n||((u=e.input)instanceof HTMLInputElement||u instanceof HTMLTextAreaElement?u.value:u.innerHTML),function(e,t,n){return t?t(e):e.length>=n}(s=e.query?e.query(s):s,e.trigger,e.threshold)?d(e,s).then((function(n){try{return e.feedback instanceof Error?i():(h(s,e),e.resultsList&&function(e){var n=e.resultsList,r=e.list,i=e.resultItem,o=e.feedback,s=o.matches,u=o.results;if(e.cursor=-1,r.innerHTML="",s.length||n.noResults){var c=new DocumentFragment;u.forEach((function(e,n){var r=a(i.tag,t({id:"".concat(i.id,"_").concat(n),role:"option",innerHTML:e.match,inside:c},i.class&&{class:i.class}));i.element&&i.element(r,e);})),r.append(c),n.element&&n.element(r,o),g(e);}else w(e);}(e),c.call(r))}catch(e){return o(e)}}),o):(w(e),c.call(r));function c(){return i()}}))}var S=function(e,t){for(var n in e)for(var r in e[n])t(n,r);},T=function(e){var n,r,i,o=e.events,s=(n=function(){return j(e)},r=e.debounce,function(){clearTimeout(i),i=setTimeout((function(){return n()}),r);}),u=e.events=t({input:t({},o&&o.input)},e.resultsList&&{list:o?t({},o.list):{}}),a={input:{input:function(){s();},keydown:function(t){!function(e,t){switch(e.keyCode){case 40:case 38:e.preventDefault(),40===e.keyCode?A(t):k(t);break;case 13:t.submit||e.preventDefault(),t.cursor>=0&&L(t,e);break;case 9:t.resultsList.tabSelect&&t.cursor>=0&&L(t,e);break;case 27:t.input.value="",w(t);}}(t,e);},blur:function(){w(e);}},list:{mousedown:function(e){e.preventDefault();},click:function(t){!function(e,t){var n=t.resultItem.tag.toUpperCase(),r=Array.from(t.list.querySelectorAll(n)),i=e.target.closest(n);i&&i.nodeName===n&&L(t,e,r.indexOf(i));}(t,e);}}};S(a,(function(t,n){(e.resultsList||"input"===n)&&(u[t][n]||(u[t][n]=a[t][n]));})),S(u,(function(t,n){e[t].addEventListener(n,u[t][n]);}));};function E(e){var n=this;return new Promise((function(r,i){var o,s,u;if(o=e.placeHolder,u={role:"combobox","aria-owns":(s=e.resultsList).id,"aria-haspopup":!0,"aria-expanded":!1},a(e.input,t(t({"aria-controls":s.id,"aria-autocomplete":"both"},o&&{placeholder:o}),!e.wrapper&&t({},u))),e.wrapper&&(e.wrapper=a("div",t({around:e.input,class:e.name+"_wrapper"},u))),s&&(e.list=a(s.tag,t({dest:[s.destination,s.position],id:s.id,role:"listbox",hidden:"hidden"},s.class&&{class:s.class}))),T(e),e.data.cache)return d(e).then((function(e){try{return c.call(n)}catch(e){return i(e)}}),i);function c(){return f("init",e),r()}return c.call(n)}))}function x(e){var t=e.prototype;t.init=function(){E(this);},t.start=function(e){j(this,e);},t.unInit=function(){if(this.wrapper){var e=this.wrapper.parentNode;e.insertBefore(this.input,this.wrapper),e.removeChild(this.wrapper);}var t;S((t=this).events,(function(e,n){t[e].removeEventListener(n,t.events[e][n]);}));},t.open=function(){g(this);},t.close=function(){w(this);},t.goTo=function(e){O(e,this);},t.next=function(){A(this);},t.previous=function(){k(this);},t.select=function(e){L(this,null,e);},t.search=function(e,t,n){return p(e,t,n)};}return function e(t){this.options=t,this.id=e.instances=(e.instances||0)+1,this.name="autoComplete",this.wrapper=1,this.threshold=1,this.debounce=0,this.resultsList={position:"afterend",tag:"ul",maxResults:5},this.resultItem={tag:"li"},function(e){var t=e.name,r=e.options,i=e.resultsList,o=e.resultItem;for(var s in r)if("object"===n(r[s]))for(var a in e[s]||(e[s]={}),r[s])e[s][a]=r[s][a];else e[s]=r[s];e.selector=e.selector||"#"+t,i.destination=i.destination||e.selector,i.id=i.id||t+"_list_"+e.id,o.id=o.id||t+"_result",e.input=u(e.selector);}(this),x.call(this,e),E(this);}},module.exports=t();
    } (autoComplete_min));

    var autoComplete = autoComplete_minExports;

    const bigram = nGram(2);
    nGram(3);

    /**
     * Factory returning a function that converts a value string to n-grams.
     *
     * @param {number} n
     */
    function nGram(n) {
      if (
        typeof n !== 'number' ||
        Number.isNaN(n) ||
        n < 1 ||
        n === Number.POSITIVE_INFINITY
      ) {
        throw new Error('`' + n + '` is not a valid argument for `n-gram`')
      }

      return grams

      /**
       * Create n-grams from a given value.
       *
       * @template {string|Array<unknown>} T
       * @param {T} [value]
       * @returns {T extends any[] ? T : Array<string>}
       */
      function grams(value) {
        /** @type {T extends any[] ? T : Array<string>} */
        // @ts-expect-error: pretty sure this is fine.
        const nGrams = [];

        if (value === null || value === undefined) {
          return nGrams
        }

        const source = typeof value.slice === 'function' ? value : String(value);
        let index = source.length - n + 1;

        if (index < 1) {
          return nGrams
        }

        while (index--) {
          nGrams[index] = source.slice(index, index + n);
        }

        return nGrams
      }
    }

    /**
     * Get the difference according to Sørensen–Dice.
     *
     * > 👉 **Note**: you can pass bigrams (from [`n-gram`][n-gram]) too, which will
     * > improve performance when you are comparing the same values multiple times.
     *
     * @param {string|Array<string>} value
     *   Primary value.
     * @param {string|Array<string>} other
     *   Other value.
     * @returns {number}
     *   Difference.
     *
     *   The result is normalized to a number between `0` (completely different)
     *   and `1` (exactly the same).
     */
    function diceCoefficient(value, other) {
      const left = toPairs(value);
      const right = toPairs(other);
      let index = -1;
      let intersections = 0;

      while (++index < left.length) {
        const leftPair = left[index];
        let offset = -1;

        while (++offset < right.length) {
          const rightPair = right[offset];

          if (leftPair === rightPair) {
            intersections++;

            // Make sure this pair never matches again.
            right[offset] = '';
            break
          }
        }
      }

      return (2 * intersections) / (left.length + right.length)
    }

    /**
     * @param {string|Array<string>} value
     * @returns {Array<string>}
     */
    function toPairs(value) {
      if (Array.isArray(value)) {
        return value.map((bigram) => normalize(bigram))
      }

      const normal = normalize(value);
      return normal.length === 1 ? [normal] : bigram(normal)
    }

    /**
     * @param {string} value
     * @returns {string}
     */
    function normalize(value) {
      return String(value).toLowerCase()
    }

    /* src\GuessInput.svelte generated by Svelte v3.47.0 */

    function create_else_block(ctx) {
    	let t0;
    	let span;

    	return {
    		c() {
    			t0 = text("Skip ");
    			span = element("span");
    			span.textContent = "(+1.5s)";
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, span, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(span);
    		}
    	};
    }

    // (146:20) {#if isPrime}
    function create_if_block$1(ctx) {
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let t3;

    	return {
    		c() {
    			t0 = text("Skip\r\n                        ");
    			span = element("span");
    			t1 = text("(+");
    			t2 = text(/*currentAttempt*/ ctx[0]);
    			t3 = text("s)");
    			attr(span, "class", "tracking-normal lowercase");
    			toggle_class(span, "hidden", /*currentAttempt*/ ctx[0] >= /*config*/ ctx[1].maxAttempts);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, span, anchor);
    			append(span, t1);
    			append(span, t2);
    			append(span, t3);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*currentAttempt*/ 1) set_data(t2, /*currentAttempt*/ ctx[0]);

    			if (dirty & /*currentAttempt, config*/ 3) {
    				toggle_class(span, "hidden", /*currentAttempt*/ ctx[0] >= /*config*/ ctx[1].maxAttempts);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(span);
    		}
    	};
    }

    // (144:16) <Button secondary={true} on:click={() => c("skipped")}>
    function create_default_slot_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*isPrime*/ ctx[2]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (159:16) <Button primary={true} on:click={c}>
    function create_default_slot$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Submit");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div1;
    	let svg0;
    	let circle;
    	let line0;
    	let t0;
    	let input;
    	let t1;
    	let div0;
    	let t2;
    	let div2;
    	let button0;
    	let t3;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;

    	button0 = new Button({
    			props: {
    				secondary: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	button0.$on("click", /*click_handler_1*/ ctx[11]);

    	button1 = new Button({
    			props: {
    				primary: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	button1.$on("click", /*c*/ ctx[5]);

    	return {
    		c() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			svg0 = svg_element("svg");
    			circle = svg_element("circle");
    			line0 = svg_element("line");
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			div0 = element("div");
    			div0.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    			t2 = space();
    			div2 = element("div");
    			create_component(button0.$$.fragment);
    			t3 = space();
    			create_component(button1.$$.fragment);
    			attr(circle, "cx", "11");
    			attr(circle, "cy", "11");
    			attr(circle, "r", "8");
    			attr(line0, "x1", "21");
    			attr(line0, "y1", "21");
    			attr(line0, "x2", "16.65");
    			attr(line0, "y2", "16.65");
    			attr(svg0, "class", "absolute top-4 left-3");
    			attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg0, "width", "18");
    			attr(svg0, "height", "18");
    			attr(svg0, "viewBox", "0 0 24 24");
    			attr(svg0, "fill", "none");
    			attr(svg0, "stroke", "currentColor");
    			attr(svg0, "stroke-width", "2");
    			attr(svg0, "stroke-linecap", "round");
    			attr(svg0, "stroke-linejoin", "round");
    			attr(input, "class", "focus:outline-none focus:border-custom-positive w-full p-3 pl-9 placeholder:text-custom-line bg-custom-bg text-custom-fg border-custom-mg");
    			attr(input, "id", "autoComplete");
    			attr(input, "type", "search");
    			attr(input, "dir", "ltr");
    			attr(input, "spellcheck", "false");
    			attr(input, "autocorrect", "off");
    			attr(input, "autocomplete", "off");
    			attr(input, "autocapitalize", "off");
    			attr(div0, "class", "absolute right-3 top-4");
    			attr(div1, "class", "autoComplete_wrapper relative");
    			attr(div2, "class", "flex justify-between pt-3");
    			attr(div4, "class", "m-3 mt-0");
    			attr(div5, "class", "max-w-screen-sm w-full mx-auto flex-col");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div3);
    			append(div3, div1);
    			append(div1, svg0);
    			append(svg0, circle);
    			append(svg0, line0);
    			append(div1, t0);
    			append(div1, input);
    			set_input_value(input, /*guess*/ ctx[3]);
    			append(div1, t1);
    			append(div1, div0);
    			append(div3, t2);
    			append(div3, div2);
    			mount_component(button0, div2, null);
    			append(div2, t3);
    			mount_component(button1, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*input_input_handler*/ ctx[9]),
    					listen(div0, "click", /*click_handler*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*guess*/ 8) {
    				set_input_value(input, /*guess*/ ctx[3]);
    			}

    			const button0_changes = {};

    			if (dirty & /*$$scope, currentAttempt, config, isPrime*/ 8199) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div5);
    			destroy_component(button0);
    			destroy_component(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let guess;
    	let { allOptions } = $$props;
    	let { currentAttempt } = $$props;
    	let { config } = $$props;
    	let { isPrime } = $$props;

    	const l = {
    		focus() {
    			document.getElementById("autoComplete").focus();
    		},
    		clear() {
    			document.getElementById("autoComplete").value = "";
    			$$invalidate(3, guess = "");
    		}
    	};

    	const dispatch = createEventDispatcher();

    	function c(e) {
    		"skipped" == e
    		? (dispatch("guess", { guess, isSkipped: !0 }), $$invalidate(3, guess = ""))
    		: undefined !== guess && "" !== guess.trim()
    			? (dispatch("guess", { guess, isSkipped: !1 }), $$invalidate(3, guess = ""))
    			: l.focus();
    	}

    	onMount(() => {
    		!(function () {
    			const e = new autoComplete({
    					placeHolder: "Know it? Search for the artist / title",
    					threshold: 1,
    					wrapper: !1,
    					resultsList: { maxResults: 6 },
    					diacritics: !0,
    					noresults: !0,
    					searchEngine: "loose",
    					data: {
    						src: allOptions,
    						cache: !1,
    						filter: e => {
    							if (e.length < 6) return e;
    							const t = document.getElementById("autoComplete").value.toLowerCase();

    							return e = e.sort((e, n) => {
    								let r = diceCoefficient(t, e.value.toLowerCase()),
    									s = diceCoefficient(t, n.value.toLowerCase());

    								return r === s ? e.value > n.value ? -1 : 1 : s > r ? 1 : -1;
    							});
    						}
    					},
    					resultItem: { highlight: !0 },
    					events: {
    						focus: {
    							focus: e => {
    								
    							}
    						},
    						input: {
    							selection: t => {
    								const s = t.detail.selection.value;
    								e.input.value = s;
    								$$invalidate(3, guess = s);
    							}
    						}
    					}
    				});
    		})();
    	});

    	const guessInput = () => l;

    	const togglePlayState = () => {
    		soundcloudWidget.toggle();
    	};

    	function input_input_handler() {
    		guess = this.value;
    		$$invalidate(3, guess);
    	}

    	const click_handler = () => l.clear();
    	const click_handler_1 = () => c("skipped");

    	$$self.$$set = $$props => {
    		if ('allOptions' in $$props) $$invalidate(6, allOptions = $$props.allOptions);
    		if ('currentAttempt' in $$props) $$invalidate(0, currentAttempt = $$props.currentAttempt);
    		if ('config' in $$props) $$invalidate(1, config = $$props.config);
    		if ('isPrime' in $$props) $$invalidate(2, isPrime = $$props.isPrime);
    	};

    	return [
    		currentAttempt,
    		config,
    		isPrime,
    		guess,
    		l,
    		c,
    		allOptions,
    		guessInput,
    		togglePlayState,
    		input_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class GuessInput extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			allOptions: 6,
    			currentAttempt: 0,
    			config: 1,
    			isPrime: 2,
    			guessInput: 7,
    			togglePlayState: 8
    		});
    	}

    	get guessInput() {
    		return this.$$.ctx[7];
    	}

    	get togglePlayState() {
    		return this.$$.ctx[8];
    	}
    }

    /* src\Game.svelte generated by Svelte v3.47.0 */

    const { document: document_1, window: window_1 } = globals;

    function create_if_block_1(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				hasFrame: /*modalState*/ ctx[10].hasFrame,
    				title: /*modalState*/ ctx[10].title,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	modal.$on("close", /*close_handler_1*/ ctx[21]);

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty[0] & /*modalState*/ 1024) modal_changes.hasFrame = /*modalState*/ ctx[10].hasFrame;
    			if (dirty[0] & /*modalState*/ 1024) modal_changes.title = /*modalState*/ ctx[10].title;

    			if (dirty[0] & /*modalState, userStats, gameState, userGuesses, todaysGame*/ 1816 | dirty[1] & /*$$scope*/ 2) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (268:48) 
    function create_if_block_5(ctx) {
    	let helpmodal;
    	let current;
    	helpmodal = new HelpModal({});
    	helpmodal.$on("close", /*close_handler*/ ctx[20]);

    	return {
    		c() {
    			create_component(helpmodal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(helpmodal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(helpmodal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(helpmodal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(helpmodal, detaching);
    		}
    	};
    }

    // (253:51) 
    function create_if_block_4(ctx) {
    	let statsmodal;
    	let current;

    	statsmodal = new StatsModal({
    			props: {
    				userStats: /*userStats*/ ctx[3],
    				config: /*config*/ ctx[13],
    				isPrime: /*gameState*/ ctx[9].isPrime,
    				daysSince: /*answerIndex*/ ctx[14],
    				todaysScore: /*userGuesses*/ ctx[8].length,
    				guessRef: /*todaysGame*/ ctx[4].gotCorrect
    				? /*userGuesses*/ ctx[8].length + 1
    				: 0,
    				hasFinished: /*todaysGame*/ ctx[4].hasFinished
    			}
    		});

    	return {
    		c() {
    			create_component(statsmodal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(statsmodal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const statsmodal_changes = {};
    			if (dirty[0] & /*userStats*/ 8) statsmodal_changes.userStats = /*userStats*/ ctx[3];
    			if (dirty[0] & /*gameState*/ 512) statsmodal_changes.isPrime = /*gameState*/ ctx[9].isPrime;
    			if (dirty[0] & /*userGuesses*/ 256) statsmodal_changes.todaysScore = /*userGuesses*/ ctx[8].length;

    			if (dirty[0] & /*todaysGame, userGuesses*/ 272) statsmodal_changes.guessRef = /*todaysGame*/ ctx[4].gotCorrect
    			? /*userGuesses*/ ctx[8].length + 1
    			: 0;

    			if (dirty[0] & /*todaysGame*/ 16) statsmodal_changes.hasFinished = /*todaysGame*/ ctx[4].hasFinished;
    			statsmodal.$set(statsmodal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(statsmodal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(statsmodal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(statsmodal, detaching);
    		}
    	};
    }

    // (251:50) 
    function create_if_block_3(ctx) {
    	let donatemodal;
    	let current;
    	donatemodal = new DonateModal({});

    	return {
    		c() {
    			create_component(donatemodal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(donatemodal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(donatemodal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(donatemodal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(donatemodal, detaching);
    		}
    	};
    }

    // (249:12) {#if modalState.name == "info"}
    function create_if_block_2(ctx) {
    	let infomodal;
    	let current;
    	infomodal = new InfoModal({});

    	return {
    		c() {
    			create_component(infomodal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(infomodal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(infomodal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(infomodal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(infomodal, detaching);
    		}
    	};
    }

    // (248:8) <Modal hasFrame={modalState.hasFrame} title={modalState.title} on:close={() => (modalState.isActive = false)}>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3, create_if_block_4, create_if_block_5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*modalState*/ ctx[10].name == "info") return 0;
    		if (/*modalState*/ ctx[10].name == "donate") return 1;
    		if (/*modalState*/ ctx[10].name == "results") return 2;
    		if (/*modalState*/ ctx[10].name == "help") return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (306:4) {#if !todaysGame.hasFinished && gameState.gameIsActive}
    function create_if_block(ctx) {
    	let guessinput;
    	let updating_guessInput;
    	let current;

    	function guessinput_guessInput_binding(value) {
    		/*guessinput_guessInput_binding*/ ctx[24](value);
    	}

    	let guessinput_props = {
    		isPrime: /*gameState*/ ctx[9].isPrime,
    		config: /*config*/ ctx[13],
    		allOptions: /*allOptions*/ ctx[7],
    		currentAttempt: /*userGuesses*/ ctx[8].length + 1
    	};

    	if (/*guessInput*/ ctx[6] !== void 0) {
    		guessinput_props.guessInput = /*guessInput*/ ctx[6];
    	}

    	guessinput = new GuessInput({ props: guessinput_props });
    	/*guessinput_binding*/ ctx[23](guessinput);
    	binding_callbacks.push(() => bind(guessinput, 'guessInput', guessinput_guessInput_binding));
    	guessinput.$on("guess", /*e15*/ ctx[17]);

    	return {
    		c() {
    			create_component(guessinput.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(guessinput, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const guessinput_changes = {};
    			if (dirty[0] & /*gameState*/ 512) guessinput_changes.isPrime = /*gameState*/ ctx[9].isPrime;
    			if (dirty[0] & /*allOptions*/ 128) guessinput_changes.allOptions = /*allOptions*/ ctx[7];
    			if (dirty[0] & /*userGuesses*/ 256) guessinput_changes.currentAttempt = /*userGuesses*/ ctx[8].length + 1;

    			if (!updating_guessInput && dirty[0] & /*guessInput*/ 64) {
    				updating_guessInput = true;
    				guessinput_changes.guessInput = /*guessInput*/ ctx[6];
    				add_flush_callback(() => updating_guessInput = false);
    			}

    			guessinput.$set(guessinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(guessinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(guessinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			/*guessinput_binding*/ ctx[23](null);
    			destroy_component(guessinput, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let meta;
    	let link0;
    	let link1;
    	let link2;
    	let link3;
    	let t0;
    	let googleanalytics;
    	let t1;
    	let main;
    	let t2;
    	let div0;
    	let header;
    	let t3;
    	let div2;
    	let div1;
    	let guesses;
    	let t4;
    	let gameresult;
    	let t5;
    	let musicplayer;
    	let t6;
    	let style_height = `${/*height*/ ctx[5]}px`;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[19]);
    	googleanalytics = new GoogleAnalytics({ props: { properties: ["G-L8RFKXWJ0Z"] } });
    	let if_block0 = /*modalState*/ ctx[10].isActive && create_if_block_1(ctx);
    	header = new Header({});
    	header.$on("modal", /*openModalCallback*/ ctx[18]);

    	guesses = new Guesses({
    			props: {
    				userGuesses: /*userGuesses*/ ctx[8],
    				maxAttempts: /*config*/ ctx[13].maxAttempts,
    				currentHeardle: /*currentHeardle*/ ctx[2],
    				todaysGame: /*todaysGame*/ ctx[4]
    			}
    		});

    	gameresult = new GameResult({
    			props: {
    				config: /*config*/ ctx[13],
    				userGuesses: /*userGuesses*/ ctx[8],
    				currentHeardle: /*currentHeardle*/ ctx[2],
    				hasFinished: /*todaysGame*/ ctx[4].hasFinished,
    				gotCorrect: /*todaysGame*/ ctx[4].gotCorrect,
    				isPrime: /*config*/ ctx[13].isPrime,
    				guessRef: /*todaysGame*/ ctx[4].gotCorrect
    				? /*userGuesses*/ ctx[8].length
    				: 0
    			}
    		});

    	let musicplayer_props = {
    		config: /*config*/ ctx[13],
    		gameState: /*gameState*/ ctx[9],
    		currentHeardle: /*currentHeardle*/ ctx[2],
    		trackDuration: /*currentHeardle*/ ctx[2].duration,
    		currentAttempt: /*userGuesses*/ ctx[8].length + 1
    	};

    	musicplayer = new MusicPlayer({ props: musicplayer_props });
    	/*musicplayer_binding*/ ctx[22](musicplayer);
    	musicplayer.$on("updateSong", /*e13*/ ctx[15]);
    	musicplayer.$on("updatePlayerState", /*e14*/ ctx[16]);
    	let if_block1 = !/*todaysGame*/ ctx[4].hasFinished && /*gameState*/ ctx[9].gameIsActive && create_if_block(ctx);

    	return {
    		c() {
    			meta = element("meta");
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			link3 = element("link");
    			t0 = space();
    			create_component(googleanalytics.$$.fragment);
    			t1 = space();
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div0 = element("div");
    			create_component(header.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(guesses.$$.fragment);
    			t4 = space();
    			create_component(gameresult.$$.fragment);
    			t5 = space();
    			create_component(musicplayer.$$.fragment);
    			t6 = space();
    			if (if_block1) if_block1.c();
    			attr(meta, "name", "description");
    			attr(meta, "content", "Guess the They Might Be Giants song from the intro in as few tries as possible");
    			attr(link0, "rel", "apple-touch-icon");
    			attr(link0, "sizes", "192x192");
    			attr(link0, "href", "/apple-touch-icon.png");
    			attr(link1, "rel", "icon");
    			attr(link1, "type", "image/png");
    			attr(link1, "sizes", "32x32");
    			attr(link1, "href", "/favicon-32x32.png");
    			attr(link2, "rel", "icon");
    			attr(link2, "type", "image/png");
    			attr(link2, "sizes", "16x16");
    			attr(link2, "href", "/favicon-16x16.png");
    			attr(link3, "rel", "manifest");
    			attr(link3, "href", "/site.webmanifest");
    			document_1.title = "TMBG Heardle";
    			attr(div0, "class", "flex-none");
    			attr(div1, "class", "max-w-screen-sm w-full mx-auto h-full flex flex-col justify-between overflow-auto");
    			attr(div2, "class", "w-full flex flex-col flex-grow relative");
    			attr(main, "class", "bg-custom-bg text-custom-fg overflow-auto flex flex-col");
    			set_style(main, "height", style_height, false);
    		},
    		m(target, anchor) {
    			append(document_1.head, meta);
    			append(document_1.head, link0);
    			append(document_1.head, link1);
    			append(document_1.head, link2);
    			append(document_1.head, link3);
    			insert(target, t0, anchor);
    			mount_component(googleanalytics, target, anchor);
    			insert(target, t1, anchor);
    			insert(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append(main, t2);
    			append(main, div0);
    			mount_component(header, div0, null);
    			append(main, t3);
    			append(main, div2);
    			append(div2, div1);
    			mount_component(guesses, div1, null);
    			append(div1, t4);
    			mount_component(gameresult, div1, null);
    			append(main, t5);
    			mount_component(musicplayer, main, null);
    			append(main, t6);
    			if (if_block1) if_block1.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window_1, "resize", /*onwindowresize*/ ctx[19]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*modalState*/ ctx[10].isActive) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*modalState*/ 1024) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const guesses_changes = {};
    			if (dirty[0] & /*userGuesses*/ 256) guesses_changes.userGuesses = /*userGuesses*/ ctx[8];
    			if (dirty[0] & /*currentHeardle*/ 4) guesses_changes.currentHeardle = /*currentHeardle*/ ctx[2];
    			if (dirty[0] & /*todaysGame*/ 16) guesses_changes.todaysGame = /*todaysGame*/ ctx[4];
    			guesses.$set(guesses_changes);
    			const gameresult_changes = {};
    			if (dirty[0] & /*userGuesses*/ 256) gameresult_changes.userGuesses = /*userGuesses*/ ctx[8];
    			if (dirty[0] & /*currentHeardle*/ 4) gameresult_changes.currentHeardle = /*currentHeardle*/ ctx[2];
    			if (dirty[0] & /*todaysGame*/ 16) gameresult_changes.hasFinished = /*todaysGame*/ ctx[4].hasFinished;
    			if (dirty[0] & /*todaysGame*/ 16) gameresult_changes.gotCorrect = /*todaysGame*/ ctx[4].gotCorrect;

    			if (dirty[0] & /*todaysGame, userGuesses*/ 272) gameresult_changes.guessRef = /*todaysGame*/ ctx[4].gotCorrect
    			? /*userGuesses*/ ctx[8].length
    			: 0;

    			gameresult.$set(gameresult_changes);
    			const musicplayer_changes = {};
    			if (dirty[0] & /*gameState*/ 512) musicplayer_changes.gameState = /*gameState*/ ctx[9];
    			if (dirty[0] & /*currentHeardle*/ 4) musicplayer_changes.currentHeardle = /*currentHeardle*/ ctx[2];
    			if (dirty[0] & /*currentHeardle*/ 4) musicplayer_changes.trackDuration = /*currentHeardle*/ ctx[2].duration;
    			if (dirty[0] & /*userGuesses*/ 256) musicplayer_changes.currentAttempt = /*userGuesses*/ ctx[8].length + 1;
    			musicplayer.$set(musicplayer_changes);

    			if (!/*todaysGame*/ ctx[4].hasFinished && /*gameState*/ ctx[9].gameIsActive) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*todaysGame, gameState*/ 528) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*height*/ 32 && style_height !== (style_height = `${/*height*/ ctx[5]}px`)) {
    				set_style(main, "height", style_height, false);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(googleanalytics.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(header.$$.fragment, local);
    			transition_in(guesses.$$.fragment, local);
    			transition_in(gameresult.$$.fragment, local);
    			transition_in(musicplayer.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(googleanalytics.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(header.$$.fragment, local);
    			transition_out(guesses.$$.fragment, local);
    			transition_out(gameresult.$$.fragment, local);
    			transition_out(musicplayer.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			detach(meta);
    			detach(link0);
    			detach(link1);
    			detach(link2);
    			detach(link3);
    			if (detaching) detach(t0);
    			destroy_component(googleanalytics, detaching);
    			if (detaching) detach(t1);
    			if (detaching) detach(main);
    			if (if_block0) if_block0.d();
    			destroy_component(header);
    			destroy_component(guesses);
    			destroy_component(gameresult);
    			/*musicplayer_binding*/ ctx[22](null);
    			destroy_component(musicplayer);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $answerTexts;
    	let $fullAnswerList;
    	const answerTexts = writable(potentialAnswers.map(e => e.answer).filter((e, i, s) => s.indexOf(e) === i));
    	component_subscribe($$self, answerTexts, value => $$invalidate(27, $answerTexts = value));

    	const fullAnswerList = readable(answerIndexes.map(e => potentialAnswers[e]), () => {
    		
    	});

    	component_subscribe($$self, fullAnswerList, value => $$invalidate(28, $fullAnswerList = value));
    	let i, o;

    	const config = {
    		attemptInterval: 1.5e3,
    		attemptIntervalAlt: [1e3, 2e3, 4e3, 7e3, 11e3, 16e3],
    		maxAttempts: 6,
    		startDate: "2022-12-22"
    	};

    	let answerIndex = daysSinceStartDate(config.startDate) % $fullAnswerList.length;

    	let currentHeardle = {
    		url: $fullAnswerList[answerIndex].url,
    		correctAnswer: $fullAnswerList[answerIndex].answer,
    		id: daysSinceStartDate(config.startDate) + idOffset,
    		guessList: [],
    		hasFinished: !1,
    		hasStarted: !1
    	};

    	var c, d;

    	(undefined !== document.hidden
    	? (c = "hidden", d = "visibilitychange")
    	: undefined !== document.msHidden
    		? (c = "msHidden", d = "msvisibilitychange")
    		: undefined !== document.webkitHidden && (c = "webkitHidden", d = "webkitvisibilitychange"), undefined === document.addEventListener || undefined === c || document.addEventListener(
    		d,
    		function () {
    			document[c] || answerIndex === daysSinceStartDate(config.startDate) % $fullAnswerList.length || location.reload(!0);
    		},
    		!1
    	));

    	let userStats, todaysGame, height = 0;

    	function onResize() {
    		$$invalidate(5, height = window.innerHeight);
    	}

    	onMount(() => {
    		onResize();
    	});

    	if (null == localStorage.getItem("userStats")) {
    		userStats = [];
    		localStorage.setItem("userStats", JSON.stringify(userStats));
    	} else {
    		userStats = JSON.parse(localStorage.getItem("userStats"));
    	}

    	todaysGame = userStats.find(e => e.id === currentHeardle.id);

    	if (undefined === todaysGame) {
    		todaysGame = currentHeardle;
    		userStats.push(todaysGame);
    		localStorage.setItem("userStats", JSON.stringify(userStats));
    	}

    	let guessInput;
    	let allOptions;
    	let userGuesses = todaysGame.guessList;

    	let gameState = {
    		gameIsActive: false,
    		musicIsPlaying: false,
    		playerIsReady: false,
    		isPrime: true
    	};

    	let modalState = {
    		isActive: false,
    		hasFrame: true,
    		name: "",
    		title: ""
    	};

    	function openModal(name, title, hasFrame) {
    		$$invalidate(10, modalState.isActive = !0, modalState);
    		$$invalidate(10, modalState.name = name, modalState);
    		$$invalidate(10, modalState.title = title, modalState);
    		$$invalidate(10, modalState.hasFrame = hasFrame, modalState);
    	}

    	function e13(e) {
    		let t = e.detail.currentSong;
    		$$invalidate(2, currentHeardle.artist = currentHeardle.correctAnswer.split(" - ")[1], currentHeardle);
    		$$invalidate(2, currentHeardle.title = currentHeardle.correctAnswer.split(" - ")[0], currentHeardle);
    		$$invalidate(2, currentHeardle.img = t.artwork_url, currentHeardle);
    		$$invalidate(2, currentHeardle.duration = t.duration, currentHeardle);
    		$$invalidate(2, currentHeardle.genre = t.genre, currentHeardle);
    		$$invalidate(2, currentHeardle.date = t.release_date, currentHeardle);

    		// Add the correct answer, but only if it doesnt exist already.
    		// Otherwise we get duplicates in the autosuggest box
    		(set_store_value(
    			answerTexts,
    			$answerTexts = $answerTexts.indexOf(currentHeardle.correctAnswer) >= 0
    			? $answerTexts
    			: [...$answerTexts, currentHeardle.correctAnswer],
    			$answerTexts
    		), $$invalidate(7, /*
              (function (e, t, n) {
    e.set(n);
              })(answerTextList, answerTexts, answerTexts),
              */
    		allOptions = $answerTexts), $$invalidate(9, gameState.playerIsReady = !0, gameState), todaysGame.hasFinished || $$invalidate(9, gameState.gameIsActive = !0, gameState));
    	}

    	function e14(e) {
    		console.log("onUpdatePlayerState (e14)" + e);

    		if (!currentHeardle.hasStarted) {
    			addEvent("startGame#" + currentHeardle.id, { name: "startGame" });
    			addEvent("startGame", { name: "startGame" });
    			$$invalidate(2, currentHeardle.hasStarted = true, currentHeardle);
    		}

    		$$invalidate(9, gameState.musicIsPlaying = e.detail.musicIsPlaying, gameState);
    	}

    	function e15(e) {
    		let t = e.detail.guess, r = e.detail.isSkipped, s = !1;
    		var wonGame;

    		(r || t != currentHeardle.correctAnswer || (s = !0, addEvent("correctGuess", { name: "correctGuess" }), addEvent("correctGuess#" + currentHeardle.id, { name: "correctGuess" })), r
    		? (addEvent("skippedGuess", { name: "skippedGuess" }), addEvent("skippedGuess#" + currentHeardle.id, { name: "skippedGuess" }))
    		: s || (addEvent("incorrectGuess", { name: "incorrectGuess" }), addEvent("incorrectGuess#" + currentHeardle.id, { name: "incorrectGuess" })), $$invalidate(8, userGuesses = userGuesses.concat({
    			answer: e.detail.guess,
    			isCorrect: s,
    			isSkipped: r
    		})), $$invalidate(4, todaysGame.guessList = userGuesses, todaysGame));

    		localStorage.setItem("userStats", JSON.stringify(userStats));

    		if (userGuesses.length == config.maxAttempts || 1 == s) {
    			wonGame = s;
    			$$invalidate(9, gameState.gameIsActive = !1, gameState);
    			$$invalidate(4, todaysGame.hasFinished = !0, todaysGame);
    			$$invalidate(4, todaysGame.gotCorrect = wonGame, todaysGame);
    			$$invalidate(4, todaysGame.score = userGuesses.length, todaysGame);

    			(localStorage.setItem("userStats", JSON.stringify(userStats)), i.resetAndPlay(), wonGame
    			? (addEvent("wonGame", { name: "won" }), addEvent("wonGame#" + currentHeardle.id, { name: "won" }))
    			: (addEvent("lostGame", { name: "lost" }), addEvent("lostGame#" + currentHeardle.id, { name: "lost" })), addEvent("endGame" + currentHeardle.id + "in" + userGuesses.length, { name: "#" + userGuesses.length }), addEvent("endGame", { name: "endGame" }), addEvent("endGame#" + currentHeardle.id, { name: "endGame" }), addEvent("gameStats#" + currentHeardle.id, { name: userGuesses }));
    		}
    	}

    	function openModalCallback(e) {
    		openModal(e.detail.name, e.detail.title, e.detail.hasFrame);
    	}

    	function daysSinceStartDate(e) {
    		var t = moment(e, "YYYY-MM-DD");
    		return moment().diff(t, "days");
    	}

    	if (localStorage.getItem("firstTime") == null) {
    		(openModal("help", "how to play"), localStorage.setItem("firstTime", "false"));
    	}

    	function onwindowresize() {
    		$$invalidate(5, height = window_1.innerHeight);
    	}

    	const close_handler = () => $$invalidate(10, modalState.isActive = false, modalState);
    	const close_handler_1 = () => $$invalidate(10, modalState.isActive = false, modalState);

    	function musicplayer_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			i = $$value;
    			$$invalidate(0, i);
    		});
    	}

    	function guessinput_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			o = $$value;
    			$$invalidate(1, o);
    		});
    	}

    	function guessinput_guessInput_binding(value) {
    		guessInput = value;
    		$$invalidate(6, guessInput);
    	}

    	return [
    		i,
    		o,
    		currentHeardle,
    		userStats,
    		todaysGame,
    		height,
    		guessInput,
    		allOptions,
    		userGuesses,
    		gameState,
    		modalState,
    		answerTexts,
    		fullAnswerList,
    		config,
    		answerIndex,
    		e13,
    		e14,
    		e15,
    		openModalCallback,
    		onwindowresize,
    		close_handler,
    		close_handler_1,
    		musicplayer_binding,
    		guessinput_binding,
    		guessinput_guessInput_binding
    	];
    }

    class Game extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);
    	}
    }

    var game = new Game({
    	target: document.body
    });

    return game;

})();
//# sourceMappingURL=bundle.js.map
