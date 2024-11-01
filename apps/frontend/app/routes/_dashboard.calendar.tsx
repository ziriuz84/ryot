import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	Card,
	Container,
	Group,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import type { LoaderFunctionArgs, MetaArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
	UserCalendarEventsDocument,
	type UserCalendarEventsQuery,
} from "@ryot/generated/graphql/backend/graphql";
import { isNumber, snakeCase, startCase, sum, truncate } from "@ryot/ts-utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { $path } from "remix-routes";
import { z } from "zod";
import { zx } from "zodix";
import { dayjsLib } from "~/lib/generals";
import { useAppSearchParam } from "~/lib/hooks";
import {
	getEnhancedCookieName,
	redirectUsingEnhancedCookieSearchParams,
	serverGqlService,
} from "~/lib/utilities.server";

const searchParamsSchema = z.object({
	date: z.coerce.date().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const cookieName = await getEnhancedCookieName("calendar", request);
	await redirectUsingEnhancedCookieSearchParams(request, cookieName);
	const query = zx.parseQuery(request, searchParamsSchema);
	const date = dayjsLib(query.date);
	const [{ userCalendarEvents }] = await Promise.all([
		serverGqlService.authenticatedRequest(request, UserCalendarEventsDocument, {
			input: { month: date.month() + 1, year: date.year() },
		}),
	]);
	return { query, userCalendarEvents, cookieName };
};

export const meta = (_args: MetaArgs<typeof loader>) => {
	return [{ title: "Calendar | Ryot" }];
};

export default function Page() {
	const loaderData = useLoaderData<typeof loader>();
	const [_, { setP }] = useAppSearchParam(loaderData.cookieName);
	const date = dayjsLib(loaderData.query.date);

	return (
		<Container size="xs">
			<Stack>
				<Group justify="space-between">
					<Title order={3} td="underline">
						{date.format("MMMM, YYYY")}
					</Title>
					<Button.Group>
						<ActionIcon
							variant="outline"
							onClick={() => {
								const newMonth = date.subtract(1, "month");
								setP("date", newMonth.toISOString());
							}}
						>
							<IconChevronLeft />
						</ActionIcon>
						<ActionIcon
							variant="outline"
							ml="xs"
							onClick={() => {
								const newMonth = date.add(1, "month");
								setP("date", newMonth.toISOString());
							}}
						>
							<IconChevronRight />
						</ActionIcon>
					</Button.Group>
				</Group>
				{loaderData.userCalendarEvents.length > 0 ? (
					<Box>
						<Box>
							<Text display="inline" fw="bold">
								{sum(loaderData.userCalendarEvents.map((e) => e.events.length))}
							</Text>{" "}
							items found
						</Box>
						{loaderData.userCalendarEvents.map((ce) => (
							<CalendarEvent day={ce} key={ce.date} />
						))}
					</Box>
				) : (
					<Text fs="italic">No events in this time period</Text>
				)}
			</Stack>
		</Container>
	);
}

const CalendarEvent = (props: {
	day: UserCalendarEventsQuery["userCalendarEvents"][number];
}) => {
	const date = dayjsLib(props.day.date);

	return (
		<Card
			data-calendar-date={props.day.date}
			withBorder
			radius="sm"
			padding="xs"
			mt="sm"
		>
			<Card.Section withBorder p="sm">
				<Group justify="space-between">
					<Text>{date.format("D MMMM")}</Text>
					<Text>{date.format("dddd")}</Text>
				</Group>
			</Card.Section>
			{props.day.events.map((evt) => (
				<Group
					key={evt.calendarEventId}
					data-calendar-event-id={evt.calendarEventId}
					justify="space-between"
					align="end"
				>
					<Text mt="sm" size="sm">
						<Tooltip label={evt.metadataTitle} disabled={!evt.episodeName}>
							<Anchor
								component={Link}
								to={$path("/media/item/:id", {
									id: evt.metadataId,
								})}
							>
								{truncate(evt.episodeName ?? evt.metadataTitle, { length: 40 })}
							</Anchor>
						</Tooltip>{" "}
						{isNumber(evt.showExtraInformation?.season) ? (
							<Text span c="dimmed" size="sm">
								(S{evt.showExtraInformation.season}-E
								{evt.showExtraInformation.episode})
							</Text>
						) : null}
						{isNumber(evt.podcastExtraInformation?.episode) ? (
							<Text span c="dimmed" size="sm">
								(EP-{evt.podcastExtraInformation.episode})
							</Text>
						) : null}
						{isNumber(evt.animeExtraInformation?.episode) ? (
							<Text span c="dimmed" size="sm">
								(EP-{evt.animeExtraInformation.episode})
							</Text>
						) : null}
					</Text>
					<Text size="sm" c="dimmed">
						{startCase(snakeCase(evt.metadataLot))}
					</Text>
				</Group>
			))}
		</Card>
	);
};
