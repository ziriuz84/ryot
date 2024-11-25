import {
	Button,
	Container,
	Menu,
	Modal,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import type { LoaderFunctionArgs, MetaArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { formatDateToNaiveDate } from "@ryot/ts-utils";
import { IconCalendar, IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";
import { match } from "ts-pattern";
import { z } from "zod";
import { zx } from "zodix";
import { dayjsLib } from "~/lib/generals";
import { useAppSearchParam } from "~/lib/hooks";
import {
	getEnhancedCookieName,
	redirectUsingEnhancedCookieSearchParams,
} from "~/lib/utilities.server";

const TIME_RANGES = [
	"Yesterday",
	"This Week",
	"This Month",
	"This Year",
	"Past 7 Days",
	"Past 30 Days",
	"Past 6 Months",
	"Past 12 Months",
	"Custom",
] as const;

const searchParamsSchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	range: z.enum(TIME_RANGES).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

const getStartTime = (range: (typeof TIME_RANGES)[number]) =>
	match(range)
		.with("Yesterday", () => dayjsLib().subtract(1, "day"))
		.with("This Week", () => dayjsLib().startOf("week"))
		.with("This Month", () => dayjsLib().startOf("month"))
		.with("This Year", () => dayjsLib().startOf("year"))
		.with("Past 7 Days", () => dayjsLib().subtract(7, "day"))
		.with("Past 30 Days", () => dayjsLib().subtract(30, "day"))
		.with("Past 6 Months", () => dayjsLib().subtract(6, "month"))
		.with("Past 12 Months", () => dayjsLib().subtract(12, "month"))
		.with("Custom", () => undefined)
		.exhaustive();

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const query = zx.parseQuery(request, searchParamsSchema);
	const range = query.range ?? "Past 30 Days";
	const cookieName = await getEnhancedCookieName("fitness.analytics", request);
	await redirectUsingEnhancedCookieSearchParams(request, cookieName);
	const startDate =
		query.startDate || formatDateToNaiveDate(getStartTime(range) || new Date());
	const endDate = query.endDate || formatDateToNaiveDate(dayjsLib());
	return { range, startDate, endDate, cookieName };
};

export const meta = (_args: MetaArgs<typeof loader>) => {
	return [{ title: "Fitness Analytics | Ryot" }];
};

export default function Page() {
	const loaderData = useLoaderData<typeof loader>();
	const [_, { setP, delP }] = useAppSearchParam(loaderData.cookieName);
	const [customRangeOpened, setCustomRangeOpened] = useState(false);

	return (
		<>
			<CustomDateSelectModal
				opened={customRangeOpened}
				onClose={() => setCustomRangeOpened(false)}
			/>
			<Container>
				<Stack>
					<SimpleGrid cols={{ base: 2 }} style={{ alignItems: "center" }}>
						<Text fz={{ base: "lg", md: "h1" }} ta={{ md: "center" }} fw="bold">
							Fitness Analytics
						</Text>
						<Menu position="bottom-end">
							<Menu.Target>
								<Button
									w={{ md: 200 }}
									variant="default"
									ml={{ md: "auto" }}
									leftSection={<IconCalendar />}
								>
									{loaderData.range}
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								{TIME_RANGES.map((range) => (
									<Menu.Item
										ta="right"
										key={range}
										onClick={() => {
											if (range === "Custom") {
												setCustomRangeOpened(true);
												return;
											}
											setP("range", range);
											delP("startDate");
											delP("endDate");
										}}
										color={loaderData.range === range ? "blue" : undefined}
									>
										{range}
									</Menu.Item>
								))}
							</Menu.Dropdown>
						</Menu>
					</SimpleGrid>
				</Stack>
			</Container>
		</>
	);
}

const CustomDateSelectModal = (props: {
	opened: boolean;
	onClose: () => void;
}) => {
	const loaderData = useLoaderData<typeof loader>();
	const [_, { setP }] = useAppSearchParam(loaderData.cookieName);
	const [value, setValue] = useState<[Date | null, Date | null]>([
		new Date(loaderData.startDate),
		new Date(loaderData.endDate),
	]);

	return (
		<Modal
			opened={props.opened}
			title="Select custom date range"
			onClose={props.onClose}
		>
			<Stack>
				<DatePicker
					mx="auto"
					size="md"
					type="range"
					value={value}
					w="fit-content"
					onChange={setValue}
				/>
				<Button
					variant="default"
					leftSection={<IconDeviceFloppy />}
					onClick={() => {
						setP("startDate", formatDateToNaiveDate(value[0] || new Date()));
						setP("endDate", formatDateToNaiveDate(value[1] || new Date()));
						setP("range", TIME_RANGES[8]);
						props.onClose();
					}}
				>
					Apply
				</Button>
			</Stack>
		</Modal>
	);
};
