--
-- PostgreSQL database dump
--

\restrict vrjJYzdffXTWsrCv6i8WJfOTgKzqSOG3vPphoLPBNqoHbzhFL13SNl4cAk3Ba7F

-- Dumped from database version 15.19 (Debian 15.19-0+deb12u1)
-- Dumped by pg_dump version 15.19 (Debian 15.19-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: couples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.couples (
    id integer NOT NULL,
    name character varying(80) DEFAULT 'Пара'::character varying NOT NULL,
    join_code character varying(24) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: couples_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.couples_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: couples_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.couples_id_seq OWNED BY public.couples.id;


--
-- Name: day_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.day_classes (
    id integer NOT NULL,
    couple_id integer NOT NULL,
    partner_key character varying(8) NOT NULL,
    day integer NOT NULL,
    pair_count integer DEFAULT 0 NOT NULL,
    start_time character varying(5),
    end_time character varying(5),
    note text
);


--
-- Name: day_classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.day_classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: day_classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.day_classes_id_seq OWNED BY public.day_classes.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    couple_id integer NOT NULL,
    key character varying(8) NOT NULL,
    name character varying(64) NOT NULL,
    title character varying(128),
    color character varying(16) DEFAULT '#e88bab'::character varying NOT NULL
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    couple_id integer NOT NULL,
    plan_date character varying(10) NOT NULL,
    start_time character varying(5) DEFAULT '18:00'::character varying NOT NULL,
    end_time character varying(5) DEFAULT '20:00'::character varying NOT NULL,
    title character varying(160) NOT NULL,
    note text,
    day integer,
    status character varying(16) DEFAULT 'planned'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token character varying(64) NOT NULL,
    user_id integer NOT NULL,
    couple_id integer NOT NULL,
    "userAgent" text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    couple_id integer NOT NULL,
    week_label character varying(128),
    travel_minutes integer DEFAULT 30 NOT NULL,
    return_travel_minutes integer DEFAULT 35 NOT NULL,
    her_return_minutes integer DEFAULT 15 NOT NULL,
    pair_minutes integer DEFAULT 80 NOT NULL,
    break_minutes integer DEFAULT 10 NOT NULL,
    max_wait_minutes integer DEFAULT 50 NOT NULL,
    max_gap_pairs integer DEFAULT 1 NOT NULL,
    fatigue_solo_pairs integer DEFAULT 4 NOT NULL,
    fatigue_total_pairs integer DEFAULT 6 NOT NULL,
    homework_minutes integer DEFAULT 40 NOT NULL,
    day_start character varying(5) DEFAULT '07:30'::character varying NOT NULL,
    her_curfew character varying(5) DEFAULT '21:30'::character varying NOT NULL,
    my_curfew character varying(5) DEFAULT '22:30'::character varying NOT NULL,
    min_meeting_minutes integer DEFAULT 45 NOT NULL,
    meet_place character varying(128) DEFAULT 'у её техникума'::character varying NOT NULL
);


--
-- Name: time_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_blocks (
    id integer NOT NULL,
    couple_id integer NOT NULL,
    partner_key character varying(8) NOT NULL,
    day integer NOT NULL,
    kind character varying(12) NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    label text
);


--
-- Name: time_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.time_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: time_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.time_blocks_id_seq OWNED BY public.time_blocks.id;


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads (
    id integer NOT NULL,
    couple_id integer NOT NULL,
    partner_key character varying(8) NOT NULL,
    kind character varying(16) NOT NULL,
    "fileName" text NOT NULL,
    "mimeType" text DEFAULT 'image/png'::text NOT NULL,
    data text NOT NULL,
    "sizeBytes" integer DEFAULT 0 NOT NULL,
    "ocrText" text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uploads_id_seq OWNED BY public.uploads.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    couple_id integer NOT NULL,
    login character varying(40) NOT NULL,
    display_name character varying(40) NOT NULL,
    "passwordHash" text NOT NULL,
    role character varying(8) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: couples id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couples ALTER COLUMN id SET DEFAULT nextval('public.couples_id_seq'::regclass);


--
-- Name: day_classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.day_classes ALTER COLUMN id SET DEFAULT nextval('public.day_classes_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: time_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_blocks ALTER COLUMN id SET DEFAULT nextval('public.time_blocks_id_seq'::regclass);


--
-- Name: uploads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads ALTER COLUMN id SET DEFAULT nextval('public.uploads_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: couples couples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couples
    ADD CONSTRAINT couples_pkey PRIMARY KEY (id);


--
-- Name: day_classes day_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.day_classes
    ADD CONSTRAINT day_classes_pkey PRIMARY KEY (id);


--
-- Name: partners partners_couple_id_key_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_couple_id_key_pk PRIMARY KEY (couple_id, key);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (couple_id);


--
-- Name: time_blocks time_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_pkey PRIMARY KEY (id);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: couples_join_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX couples_join_code_idx ON public.couples USING btree (join_code);


--
-- Name: day_classes_couple_partner_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX day_classes_couple_partner_day_idx ON public.day_classes USING btree (couple_id, partner_key, day);


--
-- Name: uploads_couple_partner_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uploads_couple_partner_kind_idx ON public.uploads USING btree (couple_id, partner_key, kind);


--
-- Name: users_couple_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_couple_role_idx ON public.users USING btree (couple_id, role);


--
-- Name: users_login_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_login_idx ON public.users USING btree (login);


--
-- Name: day_classes day_classes_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.day_classes
    ADD CONSTRAINT day_classes_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: partners partners_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: plans plans_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: settings settings_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: time_blocks time_blocks_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- Name: users users_couple_id_couples_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_couple_id_couples_id_fk FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vrjJYzdffXTWsrCv6i8WJfOTgKzqSOG3vPphoLPBNqoHbzhFL13SNl4cAk3Ba7F

